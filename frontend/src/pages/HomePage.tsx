import { useAuth } from "../context/AuthContext";

export default function HomePage() {
    const { user } = useAuth();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    Bienvenido, {user?.name}
                </h1>
            </div>
        </div>
    );
}
