import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
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

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        setError("");
        setIsLoading(false);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            setError("");
            await login(email, password);
            navigate("/");
        } catch (err: any) {
            const errorMessage =
                err.response?.data?.error ||
                err.response?.data?.message ||
                err.message ||
                "Error al iniciar sesión";
            setError(errorMessage);
            setIsLoading(false);
        }
    };

    return (
        <Card className="!bg-white !text-gray-900 !border-gray-200">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold text-center">
                    Iniciar Sesión
                </CardTitle>
                <CardDescription className="text-center">
                    Ingresa tus credenciales para acceder
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="email" className="!text-gray-900">
                            Email
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="tu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={isLoading}
                            className="!bg-white !text-gray-900 !border-gray-300"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password" className="!text-gray-900">
                            Contraseña
                        </Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={isLoading}
                            className="!bg-white !text-gray-900 !border-gray-300"
                        />
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col space-y-4 mt-2">
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading}
                    >
                        {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
                    </Button>

                    <div className="text-center text-sm text-gray-600">
                        ¿No tienes cuenta?{" "}
                        <Link
                            to="/registro"
                            className="text-blue-600 hover:underline font-medium"
                        >
                            Regístrate aquí
                        </Link>
                    </div>
                </CardFooter>
            </form>
        </Card>
    );
}
