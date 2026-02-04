import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../components/ui/card";

export default function HomePage() {
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        FinTrack
                    </h1>
                    <Button onClick={handleLogout} variant="outline">
                        Cerrar Sesión
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Bienvenido a FinTrack</CardTitle>
                        <CardDescription>
                            Panel de control de finanzas personales
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h3 className="font-semibold text-blue-900 mb-2">
                                    Información del Usuario
                                </h3>
                                <div className="space-y-1 text-sm text-blue-800">
                                    <p>
                                        <span className="font-medium">
                                            Nombre:
                                        </span>{" "}
                                        {user?.name} {user?.lastname}
                                    </p>
                                    <p>
                                        <span className="font-medium">
                                            Email:
                                        </span>{" "}
                                        {user?.email}
                                    </p>
                                    <p>
                                        <span className="font-medium">ID:</span>{" "}
                                        {user?.id}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <h3 className="font-semibold text-green-900 mb-2">
                                    ✅ Autenticación Exitosa
                                </h3>
                                <p className="text-sm text-green-800">
                                    Tu sesión está protegida con refresh tokens.
                                    Los tokens se renuevan automáticamente
                                    cuando expiran, manteniendo tu sesión segura
                                    y persistente.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">
                                            Transacciones
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-3xl font-bold text-blue-600">
                                            0
                                        </p>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Próximamente
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">
                                            Categorías
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-3xl font-bold text-green-600">
                                            0
                                        </p>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Próximamente
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">
                                            Presupuestos
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-3xl font-bold text-purple-600">
                                            0
                                        </p>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Próximamente
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
