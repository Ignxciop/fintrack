import { useState, useEffect, useRef } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import transactionService from "@/services/transactionService";
import type { Transaction } from "@/services/transactionService";
import recurringService from "@/services/recurringService";
import type { Recurring } from "@/services/recurringService";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface DayTransactions {
    [date: string]: Transaction[];
}

interface DayRecurrings {
    [date: string]: number;
}

const CalendarPage = () => {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
    const [dayTransactions, setDayTransactions] = useState<DayTransactions>({});
    const [dayRecurrings, setDayRecurrings] = useState<DayRecurrings>({});
    const [loading, setLoading] = useState(true);
    const calendarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchData();
    }, [currentMonth]);

    const addIndicators = () => {
        if (!calendarRef.current) return;

        const buttons = calendarRef.current.querySelectorAll(".rdp-day_button");

        if (!buttons || buttons.length === 0) return;

        buttons.forEach((button) => {
            const dataDay = button.getAttribute("data-day");

            let dayNumber: number;

            if (dataDay) {
                dayNumber = parseInt(dataDay);
            } else {
                const text = button.textContent?.trim();
                dayNumber = text ? parseInt(text) : NaN;
            }

            if (isNaN(dayNumber)) return;

            const year = currentMonth.getFullYear();
            const month = String(currentMonth.getMonth() + 1).padStart(2, "0");
            const day = String(dayNumber).padStart(2, "0");
            const dateKey = `${year}-${month}-${day}`;

            const transactions = dayTransactions[dateKey];
            const recurringCount = dayRecurrings[dateKey] || 0;

            if (
                (!transactions || transactions.length === 0) &&
                recurringCount === 0
            )
                return;

            const counts = {
                INCOME: 0,
                EXPENSE: 0,
                ADJUSTMENT: 0,
                TRANSFER: 0,
                RECURRING: recurringCount,
            };

            if (transactions) {
                transactions.forEach((transaction) => {
                    if (transaction.type === "INCOME") counts.INCOME++;
                    else if (transaction.type === "EXPENSE") counts.EXPENSE++;
                    else if (
                        transaction.type === "ADJUSTMENT_POSITIVE" ||
                        transaction.type === "ADJUSTMENT_NEGATIVE"
                    )
                        counts.ADJUSTMENT++;
                    else if (transaction.type === "TRANSFER") counts.TRANSFER++;
                });
            }

            const existing = button.querySelector(".day-indicators");
            if (existing) existing.remove();

            const container = document.createElement("div");
            container.className = "day-indicators";
            container.style.cssText =
                "display: flex !important; flex-direction: row !important; justify-content: center !important; align-items: center !important; position: absolute !important; top: 65% !important; left: 50% !important; transform: translateX(-50%) !important;";

            if (counts.INCOME > 0) {
                const dot = document.createElement("div");
                dot.className = "transaction-dot";
                dot.style.cssText = "background-color: #22c55e !important;";
                dot.title = `${counts.INCOME} ingreso${counts.INCOME > 1 ? "s" : ""}`;
                container.appendChild(dot);
            }
            if (counts.EXPENSE > 0) {
                const dot = document.createElement("div");
                dot.className = "transaction-dot";
                dot.style.cssText = "background-color: #ef4444 !important;";
                dot.title = `${counts.EXPENSE} gasto${counts.EXPENSE > 1 ? "s" : ""}`;
                container.appendChild(dot);
            }
            if (counts.TRANSFER > 0) {
                const dot = document.createElement("div");
                dot.className = "transaction-dot";
                dot.style.cssText = "background-color: #3b82f6 !important;";
                dot.title = `${counts.TRANSFER} transferencia${counts.TRANSFER > 1 ? "s" : ""}`;
                container.appendChild(dot);
            }
            if (counts.ADJUSTMENT > 0) {
                const dot = document.createElement("div");
                dot.className = "transaction-dot";
                dot.style.cssText = "background-color: #f97316 !important;";
                dot.title = `${counts.ADJUSTMENT} ajuste${counts.ADJUSTMENT > 1 ? "s" : ""}`;
                container.appendChild(dot);
            }
            if (counts.RECURRING > 0) {
                const dot = document.createElement("div");
                dot.className = "transaction-dot";
                dot.style.cssText = "background-color: #a855f7 !important;";
                dot.title = `${counts.RECURRING} recurrente${counts.RECURRING > 1 ? "s" : ""}`;
                container.appendChild(dot);
            }

            if (container.children.length > 0) {
                button.appendChild(container);
            }
        });
    };

    useEffect(() => {
        if (loading) return;
        setTimeout(addIndicators, 300);
    }, [loading, dayTransactions, dayRecurrings, currentMonth]);

    const handleDayClick = () => {
        setTimeout(addIndicators, 100);
    };

    const calculateNextExecutionDate = (
        lastDate: Date,
        frequency: string,
        interval: number,
    ): Date => {
        const nextDate = new Date(lastDate);

        switch (frequency) {
            case "DAILY":
                nextDate.setDate(nextDate.getDate() + interval);
                break;
            case "WEEKLY":
                nextDate.setDate(nextDate.getDate() + interval * 7);
                break;
            case "MONTHLY":
                nextDate.setMonth(nextDate.getMonth() + interval);
                break;
            case "YEARLY":
                nextDate.setFullYear(nextDate.getFullYear() + interval);
                break;
        }

        return nextDate;
    };

    const getRecurringDatesInRange = (
        recurring: Recurring,
        startDate: Date,
        endDate: Date,
    ): string[] => {
        const dates: string[] = [];

        let startDateStr = recurring.startDate;
        if (startDateStr.includes("T")) {
            startDateStr = startDateStr.split("T")[0];
        }
        const [startYear, startMonth, startDay] = startDateStr
            .split("-")
            .map(Number);
        const start = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);

        let endDateObj: Date;
        if (recurring.endDate) {
            let endDateStr = recurring.endDate;
            if (endDateStr.includes("T")) {
                endDateStr = endDateStr.split("T")[0];
            }
            const [endYear, endMonth, endDay] = endDateStr
                .split("-")
                .map(Number);
            endDateObj = new Date(
                endYear,
                endMonth - 1,
                endDay,
                23,
                59,
                59,
                999,
            );
        } else {
            endDateObj = new Date(endDate);
            endDateObj.setHours(23, 59, 59, 999);
        }

        const rangeStart = new Date(startDate);
        rangeStart.setHours(0, 0, 0, 0);
        const rangeEnd = new Date(endDate);
        rangeEnd.setHours(23, 59, 59, 999);

        let currentDate = new Date(start);

        while (currentDate <= endDateObj && currentDate <= rangeEnd) {
            if (currentDate >= rangeStart && currentDate >= start) {
                const dateKey = format(currentDate, "yyyy-MM-dd");
                dates.push(dateKey);
            }

            currentDate = calculateNextExecutionDate(
                currentDate,
                recurring.frequency,
                recurring.interval,
            );

            if (dates.length > 100) break;
        }

        return dates;
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const start = startOfMonth(currentMonth);
            const end = endOfMonth(currentMonth);

            const data = await transactionService.getTransactions({
                startDate: start.toISOString(),
                endDate: end.toISOString(),
                limit: 1000,
            });

            const grouped: DayTransactions = {};

            data.transactions.forEach((transaction: Transaction) => {
                let dateKey: string;
                if (transaction.date.includes("T")) {
                    dateKey = transaction.date.split("T")[0];
                } else {
                    dateKey = transaction.date.substring(0, 10);
                }

                if (!grouped[dateKey]) {
                    grouped[dateKey] = [];
                }
                grouped[dateKey].push(transaction);
            });

            setDayTransactions(grouped);

            const recurringsData = await recurringService.getRecurrings();
            const activeRecurrings = recurringsData.filter(
                (r: Recurring) => r.isActive,
            );

            const recurringCounts: DayRecurrings = {};

            activeRecurrings.forEach((recurring: Recurring) => {
                const dates = getRecurringDatesInRange(recurring, start, end);
                dates.forEach((dateKey) => {
                    if (!recurringCounts[dateKey]) {
                        recurringCounts[dateKey] = 0;
                    }
                    recurringCounts[dateKey]++;
                });
            });

            setDayRecurrings(recurringCounts);
        } catch (error) {
        } finally {
            setLoading(false);
        }
    };

    const getTransactionsForDate = (date: Date) => {
        const dateKey = format(date, "yyyy-MM-dd");
        return dayTransactions[dateKey] || [];
    };

    const selectedDayTransactions = getTransactionsForDate(selectedDate);

    const getTypeColor = (type: string) => {
        switch (type) {
            case "INCOME":
                return "bg-green-500";
            case "EXPENSE":
                return "bg-red-500";
            case "ADJUSTMENT_POSITIVE":
            case "ADJUSTMENT_NEGATIVE":
                return "bg-blue-500";
            case "TRANSFER":
                return "bg-orange-500";
            default:
                return "bg-gray-500";
        }
    };

    const getTypeName = (type: string) => {
        switch (type) {
            case "INCOME":
                return "Ingreso";
            case "EXPENSE":
                return "Gasto";
            case "ADJUSTMENT_POSITIVE":
                return "Ajuste +";
            case "ADJUSTMENT_NEGATIVE":
                return "Ajuste -";
            case "TRANSFER":
                return "Transferencia";
            default:
                return "Desconocido";
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Calendario</h1>
                    <p className="text-muted-foreground mt-1">
                        Visualiza tus movimientos por día
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                <Card className="lg:col-span-2 p-3 sm:p-6">
                    {loading ? (
                        <div className="flex items-center justify-center h-96">
                            <div className="text-center">
                                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                                <p className="text-muted-foreground">
                                    Cargando transacciones...
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div ref={calendarRef} className="w-full">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={(date) => {
                                    if (date) {
                                        setSelectedDate(date);
                                        handleDayClick();
                                    }
                                }}
                                month={currentMonth}
                                onMonthChange={setCurrentMonth}
                                locale={es}
                                weekStartsOn={1}
                                className="w-full"
                            />
                            <style>{`
								.rdp {
									width: 100% !important;
									max-width: 100% !important;
								}
								.rdp-months {
									width: 100% !important;
								}
								.rdp-month {
									width: 100% !important;
								}
								.rdp-table {
									width: 100% !important;
								}
								.rdp-cell {
									padding: 2px !important;
								}
								
								.rdp-day_button {
									aspect-ratio: 1 / 1 !important;
									width: 100% !important;
									display: flex !important;
									flex-direction: column !important;
									align-items: center !important;
                    justify-content: center !important;
                    gap: 0px !important;
                    padding: 4px !important;
                    position: relative !important;
								}
								
								.transaction-dot {
									width: 5px !important;
									height: 5px !important;
									border-radius: 50% !important;
									flex-shrink: 0 !important;
								}
								
								.day-indicators {
									gap: 3px !important;
								}
								
								@media (max-width: 639px) {
									.rdp-caption_label {
										font-size: 14px !important;
									}
									.rdp-nav_button {
										width: 28px !important;
										height: 28px !important;
									}
									.rdp-head_cell {
										font-size: 10px !important;
										padding: 1px !important;
									}
									.rdp-cell {
										padding: 1px !important;
									}
									.rdp-day_button {
										padding: 2px 1px !important;
										font-size: 11px !important;
									}
									.transaction-dot {
										width: 3.5px !important;
										height: 3.5px !important;
									}
									.day-indicators {
										gap: 2px !important;
									}
								}
							`}</style>
                        </div>
                    )}
                </Card>

                <Card className="lg:col-span-1 p-3 sm:p-6">
                    <div className="space-y-4">
                        <div>
                            <h2 className="text-xl font-semibold">
                                {format(selectedDate, "d 'de' MMMM, yyyy", {
                                    locale: es,
                                })}
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                {selectedDayTransactions.length} movimiento
                                {selectedDayTransactions.length !== 1
                                    ? "s"
                                    : ""}
                            </p>
                        </div>

                        <div className="space-y-3 max-h-[500px] overflow-y-auto">
                            {selectedDayTransactions.length === 0 ? (
                                <p className="text-muted-foreground text-sm text-center py-8">
                                    No hay movimientos en este día
                                </p>
                            ) : (
                                selectedDayTransactions.map((transaction) => (
                                    <div
                                        key={transaction.id}
                                        className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                                    >
                                        <div
                                            className={cn(
                                                "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                                                getTypeColor(transaction.type),
                                            )}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm truncate">
                                                        {transaction.description ||
                                                            "Sin descripción"}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {getTypeName(
                                                            transaction.type,
                                                        )}
                                                    </p>
                                                </div>
                                                <p
                                                    className={cn(
                                                        "font-semibold text-sm whitespace-nowrap",
                                                        transaction.type ===
                                                            "INCOME"
                                                            ? "text-green-600"
                                                            : transaction.type ===
                                                                "EXPENSE"
                                                              ? "text-red-600"
                                                              : "text-muted-foreground",
                                                    )}
                                                >
                                                    {transaction.type ===
                                                    "INCOME"
                                                        ? "+"
                                                        : "-"}
                                                    {transaction.account
                                                        ?.currency ||
                                                        "CLP"}{" "}
                                                    {parseFloat(
                                                        transaction.amount,
                                                    ).toLocaleString("es-CL", {
                                                        minimumFractionDigits: 0,
                                                        maximumFractionDigits: 0,
                                                    })}
                                                </p>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {transaction.account?.name ||
                                                    "Sin cuenta"}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default CalendarPage;
