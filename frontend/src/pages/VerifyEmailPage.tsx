import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { authService } from "../services/authService";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "../components/ui/card";
import { Mail, Clock, RefreshCw } from "lucide-react";

export default function VerifyEmailPage() {
    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [canResend, setCanResend] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email;

    // Si no hay email, redirigir a registro
    useEffect(() => {
        if (!email) {
            navigate("/registro");
        }
    }, [email, navigate]);

    // Inicializar timer desde localStorage
    useEffect(() => {
        if (!email) return;

        const expiresAtStr = localStorage.getItem(
            `verification_expires_${email}`,
        );
        if (expiresAtStr) {
            const expiresAt = parseInt(expiresAtStr);
            const remaining = Math.max(
                0,
                Math.floor((expiresAt - Date.now()) / 1000),
            );
            setTimeLeft(remaining);
            setCanResend(remaining === 0);
        } else {
            // Si no hay timestamp, crear uno nuevo (5 minutos)
            const expiresAt = Date.now() + 5 * 60 * 1000;
            localStorage.setItem(
                `verification_expires_${email}`,
                expiresAt.toString(),
            );
            setTimeLeft(300);
        }
    }, [email]);

    // Timer de cuenta regresiva
    useEffect(() => {
        if (timeLeft <= 0) {
            setCanResend(true);
            return;
        }

        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    setCanResend(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [timeLeft]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (code.length !== 6) {
            setError("El código debe tener 6 dígitos");
            return;
        }

        setIsLoading(true);

        try {
            const response = await authService.verifyEmail(email, code);

            // Guardar tokens
            if (response.data.accessToken && response.data.refreshToken) {
                localStorage.setItem("accessToken", response.data.accessToken);
                localStorage.setItem(
                    "refreshToken",
                    response.data.refreshToken,
                );
            }

            setSuccess("¡Email verificado exitosamente!");

            // Redirigir a home después de 1 segundo
            setTimeout(() => {
                navigate("/");
            }, 1000);
        } catch (err: any) {
            const errorMessage =
                err.response?.data?.message ||
                err.message ||
                "Error al verificar el código";
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        setError("");
        setSuccess("");
        setIsResending(true);

        try {
            await authService.resendVerification(email);
            setSuccess("Código reenviado. Por favor revisa tu email.");

            // Actualizar timestamp de expiración
            const expiresAt = Date.now() + 5 * 60 * 1000;
            localStorage.setItem(
                `verification_expires_${email}`,
                expiresAt.toString(),
            );
            setTimeLeft(300);
            setCanResend(false);
        } catch (err: any) {
            const errorMessage =
                err.response?.data?.message ||
                err.message ||
                "Error al reenviar el código";
            setError(errorMessage);
        } finally {
            setIsResending(false);
        }
    };

    if (!email) {
        return null; // Se redirigirá en el useEffect
    }

    return (
        <Card className="!bg-white !text-gray-900 !border-gray-200">
            <CardHeader className="space-y-1 text-center">
                <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <Mail className="w-8 h-8 text-blue-600" />
                    </div>
                </div>
                <CardTitle className="text-2xl font-bold">
                    Verifica tu Email
                </CardTitle>
                <CardDescription className="!text-gray-600">
                    Hemos enviado un código de 6 dígitos a:
                    <br />
                    <span className="font-semibold !text-gray-900">
                        {email}
                    </span>
                </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                            {success}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="code" className="!text-gray-900">
                            Código de Verificación
                        </Label>
                        <Input
                            id="code"
                            type="text"
                            placeholder="123456"
                            value={code}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, "");
                                if (value.length <= 6) {
                                    setCode(value);
                                }
                            }}
                            maxLength={6}
                            required
                            disabled={isLoading}
                            className="!bg-white !text-gray-900 !border-gray-300 text-center text-2xl tracking-widest font-mono"
                        />
                    </div>

                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>
                            {timeLeft > 0 ? (
                                <>El código expira en {formatTime(timeLeft)}</>
                            ) : (
                                <span className="text-red-600">
                                    El código ha expirado
                                </span>
                            )}
                        </span>
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col space-y-4">
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading || code.length !== 6}
                    >
                        {isLoading ? "Verificando..." : "Verificar Email"}
                    </Button>

                    <div className="text-center w-full space-y-2">
                        <p className="text-sm text-gray-600">
                            ¿No recibiste el código?
                        </p>
                        {canResend || timeLeft === 0 ? (
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full !bg-white !text-gray-900 !border-gray-300 hover:!bg-gray-50"
                                onClick={handleResend}
                                disabled={isResending}
                            >
                                <RefreshCw
                                    className={`w-4 h-4 mr-2 ${isResending ? "animate-spin" : ""}`}
                                />
                                {isResending
                                    ? "Reenviando..."
                                    : "Reenviar Código"}
                            </Button>
                        ) : (
                            <p className="text-sm text-gray-500">
                                Podrás reenviar el código en{" "}
                                {formatTime(timeLeft)}
                            </p>
                        )}
                    </div>

                    <div className="text-center text-sm text-gray-600">
                        ¿Email incorrecto?{" "}
                        <Link
                            to="/registro"
                            className="text-blue-600 hover:underline font-medium"
                        >
                            Volver a registrarse
                        </Link>
                    </div>
                </CardFooter>
            </form>
        </Card>
    );
}
