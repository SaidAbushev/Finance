import { useState } from "react";
import type { FC, FormEvent } from "react";
import { Link } from "react-router-dom";
import { Mail, Lock, User } from "lucide-react";
import { Button, Input } from "../shared/ui";
import { useAuth } from "../shared/hooks/useAuth";

const RegisterPage: FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const register = useAuth((s) => s.register);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(email, password, name);
    } catch {
      setError("Ошибка при регистрации. Попробуйте ещё раз.");
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
            Создайте новый аккаунт
          </p>
        </div>

        {/* Card */}
        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Имя"
              type="text"
              placeholder="Ваше имя"
              icon={<User size={18} />}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
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
              placeholder="Минимум 8 символов"
              icon={<Lock size={18} />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            <Button type="submit" loading={loading} className="w-full">
              Зарегистрироваться
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-[var(--color-muted)] mt-6">
          Уже есть аккаунт?{" "}
          <Link
            to="/login"
            className="text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] font-medium"
          >
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
