import { useState } from "react";
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

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        name: "",
        lastname: "",
    });
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Validaciones
        if (formData.password !== formData.confirmPassword) {
            setError("Las contraseñas no coinciden");
            return;
        }

        if (formData.password.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres");
            return;
        }

        setIsLoading(true);

        try {
            const response = await register(
                formData.email,
                formData.password,
                formData.name,
                formData.lastname,
            );

            // Si requiere verificación, redirigir a página de verificación
            if (response?.requiresVerification) {
                // Guardar timestamp de expiración (5 minutos desde ahora)
                const expiresAt = Date.now() + 5 * 60 * 1000;
                localStorage.setItem(
                    `verification_expires_${formData.email}`,
                    expiresAt.toString(),
                );
                navigate("/verificacion", { state: { email: formData.email } });
            } else {
                // Si no requiere verificación (caso futuro), ir a home
                navigate("/");
            }
        } catch (err: any) {
            // Extraer el mensaje de error del backend
            const errorMessage =
                err.response?.data?.message ||
                err.message ||
                "Error al registrarse";
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold text-center">
                    Crear Cuenta
                </CardTitle>
                <CardDescription className="text-center">
                    Completa el formulario para registrarte
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre</Label>
                            <Input
                                id="name"
                                name="name"
                                type="text"
                                placeholder="Juan"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="lastname">Apellido</Label>
                            <Input
                                id="lastname"
                                name="lastname"
                                type="text"
                                placeholder="Pérez"
                                value={formData.lastname}
                                onChange={handleChange}
                                required
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="tu@email.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Contraseña</Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">
                            Confirmar Contraseña
                        </Label>
                        <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            placeholder="••••••••"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            disabled={isLoading}
                        />
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col space-y-4 mt-2">
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading}
                    >
                        {isLoading ? "Registrando..." : "Registrarse"}
                    </Button>

                    <div className="text-center text-sm text-gray-600">
                        ¿Ya tienes cuenta?{" "}
                        <Link
                            to="/login"
                            className="text-blue-600 hover:underline font-medium"
                        >
                            Inicia sesión aquí
                        </Link>
                    </div>
                </CardFooter>
            </form>
        </Card>
    );
}
