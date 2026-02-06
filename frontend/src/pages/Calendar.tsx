import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import transactionService from "@/services/transactionService";
import type { Transaction } from "@/services/transactionService";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface DayTransactions {
    [date: string]: Transaction[];
}

const CalendarPage = () => {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
    const [dayTransactions, setDayTransactions] = useState<DayTransactions>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTransactions();
    }, [currentMonth]);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const start = startOfMonth(currentMonth);
            const end = endOfMonth(currentMonth);

            const data = await transactionService.getTransactions({
                startDate: start.toISOString(),
                endDate: end.toISOString(),
                limit: 1000,
            });

            // Agrupar transacciones por día
            const grouped: DayTransactions = {};
            data.transactions.forEach((transaction: Transaction) => {
                const dateKey = format(
                    new Date(transaction.date),
                    "yyyy-MM-dd",
                );
                if (!grouped[dateKey]) {
                    grouped[dateKey] = [];
                }
                grouped[dateKey].push(transaction);
            });

            setDayTransactions(grouped);
        } catch (error) {
            console.error("Error al cargar transacciones:", error);
        } finally {
            setLoading(false);
        }
    };

    const getTransactionsForDate = (date: Date) => {
        const dateKey = format(date, "yyyy-MM-dd");
        return dayTransactions[dateKey] || [];
    };

    const selectedDayTransactions = getTransactionsForDate(selectedDate);

    const getTypeColor = (type: Transaction["type"]) => {
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

    const getTypeName = (type: Transaction["type"]) => {
        switch (type) {
            case "INCOME":
                return "Ingreso";
            case "EXPENSE":
                return "Gasto";
            case "ADJUSTMENT_POSITIVE":
                return "Ajuste Positivo";
            case "ADJUSTMENT_NEGATIVE":
                return "Ajuste Negativo";
            case "TRANSFER":
                return "Transferencia";
            default:
                return type;
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Calendario</h1>
                <p className="text-muted-foreground mt-1">
                    Visualiza tus transacciones en el calendario
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendario - 2 columnas en desktop */}
                <Card className="lg:col-span-2 p-6">
                    {loading ? (
                        <div className="flex items-center justify-center h-[400px]">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div>
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={(date) =>
                                    date && setSelectedDate(date)
                                }
                                month={currentMonth}
                                onMonthChange={setCurrentMonth}
                                className="w-full"
                            />
                            {/* Indicadores visuales con CSS */}
                            <style>{`
								.rdp-day_button {
									position: relative;
								}
							`}</style>
                        </div>
                    )}
                </Card>

                {/* Sidebar de transacciones - 1 columna en desktop */}
                <Card className="lg:col-span-1 p-6">
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

                        {/* Resumen del día */}
                        {selectedDayTransactions.length > 0 && (
                            <div className="border-t pt-4 space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-500" />
                                        <span className="text-muted-foreground">
                                            Ingresos
                                        </span>
                                    </div>
                                    <span className="font-medium text-green-600">
                                        {
                                            selectedDayTransactions.filter(
                                                (t) => t.type === "INCOME",
                                            ).length
                                        }
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-red-500" />
                                        <span className="text-muted-foreground">
                                            Gastos
                                        </span>
                                    </div>
                                    <span className="font-medium text-red-600">
                                        {
                                            selectedDayTransactions.filter(
                                                (t) => t.type === "EXPENSE",
                                            ).length
                                        }
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                                        <span className="text-muted-foreground">
                                            Ajustes
                                        </span>
                                    </div>
                                    <span className="font-medium">
                                        {
                                            selectedDayTransactions.filter(
                                                (t) =>
                                                    t.type ===
                                                        "ADJUSTMENT_POSITIVE" ||
                                                    t.type ===
                                                        "ADJUSTMENT_NEGATIVE",
                                            ).length
                                        }
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-orange-500" />
                                        <span className="text-muted-foreground">
                                            Transferencias
                                        </span>
                                    </div>
                                    <span className="font-medium">
                                        {
                                            selectedDayTransactions.filter(
                                                (t) => t.type === "TRANSFER",
                                            ).length
                                        }
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default CalendarPage;
