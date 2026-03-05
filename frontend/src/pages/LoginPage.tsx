import { useState } from "react";
import type { FC, FormEvent } from "react";
import { Link } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import { Button, Input } from "../shared/ui";
import { useAuth } from "../shared/hooks/useAuth";

const LoginPage: FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const login = useAuth((s) => s.login);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch {
      setError("Неверный email или пароль");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-content)] px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[var(--color-text)]">
            Финансы
          </h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            Войдите в свой аккаунт
          </p>
        </div>

        {/* Card */}
        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              icon={<Mail size={18} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <Input
              label="Пароль"
              type="password"
              placeholder="Введите пароль"
              icon={<Lock size={18} />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            <Button type="submit" loading={loading} className="w-full">
              Войти
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-[var(--color-muted)] mt-6">
          Нет аккаунта?{" "}
          <Link
            to="/register"
            className="text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] font-medium"
          >
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
