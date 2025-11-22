import React, { useState } from 'react';
import { useAuth } from '../App';
import { Role, Page } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';

const StaffLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>(Role.Analyst);

  const { login, addNotification } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    await login(email, role, password);   // <-- CORRIGIDO: SENHA ENVIADA

    setIsLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    await new Promise(res => setTimeout(res, 1000));
    addNotification(`Se houver uma conta para ${forgotEmail}, um e-mail foi enviado.`, 'info');

    setResetEmailSent(true);
    setIsLoading(false);
  };

  return (
    <div className="bg-brand-light py-12 sm:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">

        {isForgotPassword ? (
          // ---------- RESET PASSWORD ----------
          <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
            <h2 className="text-3xl font-bold text-center text-brand-primary mb-2">Recuperar Senha</h2>

            {resetEmailSent ? (
              <div>
                <p className="text-center text-slate-500 my-8">
                  Se houver uma conta para <strong>{forgotEmail}</strong>, você receberá um email em breve.
                </p>

                <button
                  onClick={() => {
                    setIsForgotPassword(false);
                    setResetEmailSent(false);
                    setForgotEmail('');
                  }}
                  className="w-full bg-brand-accent text-white font-bold py-3 rounded-lg hover:opacity-90"
                >
                  Voltar para Login
                </button>
              </div>
            ) : (
              <>
                <form onSubmit={handleForgotPassword}>
                  <label className="block text-sm font-medium mb-2 text-slate-700">Email</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full px-4 py-3 border rounded-lg mb-6"
                    required
                    disabled={isLoading}
                  />

                  <button
                    type="submit"
                    className="w-full bg-brand-accent text-white font-bold py-3 rounded-lg hover:opacity-90"
                    disabled={isLoading}
                  >
                    {isLoading ? <LoadingSpinner /> : 'Enviar link de recuperação'}
                  </button>
                </form>

                <p className="text-center text-sm text-slate-600 mt-8">
                  Lembrou a senha?{" "}
                  <button
                    onClick={() => setIsForgotPassword(false)}
                    className="font-semibold text-brand-secondary hover:underline"
                    disabled={isLoading}
                  >
                    Voltar
                  </button>
                </p>
              </>
            )}
          </div>
        ) : (
          // ---------- LOGIN STAFF ----------
          <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
            <h2 className="text-3xl font-bold text-center text-brand-primary mb-2">Acesso Restrito</h2>
            <p className="text-center text-slate-500 mb-8">Login para colaboradores</p>

            <form onSubmit={handleSubmit}>
              <fieldset disabled={isLoading} className="space-y-4">

                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-700">Função</label>
                  <select
                    value={role}
                    onChange={(e) => {
                      setRole(e.target.value as Role);
                      setEmail('');
                      setPassword('');
                    }}
                    className="w-full px-4 py-3 border rounded-lg"
                  >
                    <option value={Role.Analyst}>Analista</option>
                    <option value={Role.Admin}>Administrador</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-700">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-700">Senha</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border rounded-lg"
                    required
                  />
                </div>

              </fieldset>

              <div className="flex justify-end my-4">
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(true)}
                  className="text-sm text-brand-secondary hover:underline"
                  disabled={isLoading}
                >
                  Esqueci minha senha
                </button>
              </div>

              <button
                type="submit"
                className="w-full bg-brand-accent text-white font-bold py-3 rounded-lg hover:opacity-90"
                disabled={isLoading}
              >
                {isLoading ? <LoadingSpinner /> : 'Entrar'}
              </button>

            </form>

          </div>
        )}

      </div>
    </div>
  );
};

export default StaffLoginPage;
