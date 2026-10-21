import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, Sparkles, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

interface AuthModalsProps {
  mode: 'login' | 'register' | 'forgot' | null;
  onClose: () => void;
  onSwitchMode: (mode: 'login' | 'register' | 'forgot') => void;
}

export const AuthModals: React.FC<AuthModalsProps> = ({ mode, onClose, onSwitchMode }) => {
  const { login, register } = useAuth();

  // Login form state
  const [identificador, setIdentificador] = useState('');
  const [password, setPassword] = useState('');

  // Register form state
  const [regNombre, setRegNombre] = useState('');
  const [regApellido, setRegApellido] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Forgot password form state
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState<1 | 2>(1); // 1 = request token, 2 = enter token & new password

  // Common status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!mode) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      setIsSubmitting(true);
      await login(identificador.trim(), password);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al iniciar sesión.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!regNombre.trim() || !regApellido.trim() || !regUsername.trim() || !regEmail.trim()) {
      setErrorMessage('Todos los campos son obligatorios.');
      return;
    }

    try {
      setIsSubmitting(true);
      await register({
        nombre: regNombre.trim(),
        apellido: regApellido.trim(),
        nombre_usuario: regUsername.trim(),
        email: regEmail.trim(),
        password: regPassword,
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al registrar la cuenta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      setIsSubmitting(true);
      const res = await api.forgotPassword(forgotEmail.trim());
      setSuccessMessage(res.message);
      if (res.token) {
        setResetToken(res.token);
      }
      setForgotStep(2);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al solicitar recuperación.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!resetToken.trim() || !newPassword) {
      setErrorMessage('Completa el token de recuperación y tu nueva contraseña.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.resetPassword(resetToken.trim(), newPassword);
      setSuccessMessage(res.message);
      setTimeout(() => {
        onSwitchMode('login');
      }, 2000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al restablecer la contraseña.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick fill demo test credentials
  const fillCredentials = (type: 'admin' | 'student') => {
    if (type === 'admin') {
      setIdentificador('profesor@donbosco.edu.ar');
      setPassword('DonBosco2026!');
    } else {
      setIdentificador('mateo.gomez@donbosco.edu.ar');
      setPassword('Alumno2026!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div
        className="relative bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-700 text-white flex items-center justify-center font-bold text-xs">
              DB
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {mode === 'login' && 'Iniciar Sesión'}
                {mode === 'register' && 'Registro de Alumnos'}
                {mode === 'forgot' && 'Recuperar Contraseña'}
              </h3>
              <p className="text-[10px] text-slate-500">Don Bosco • Habilidades Digitales 2026</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status alerts */}
        <div className="px-6 pt-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="p-6 pt-2 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email o Nombre de Usuario
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={identificador}
                  onChange={(e) => setIdentificador(e.target.value)}
                  placeholder="ej: usuario o tu.correo@donbosco.edu.ar"
                  className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={() => onSwitchMode('forgot')}
                  className="text-[11px] text-blue-600 hover:underline cursor-pointer"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 rounded-xl shadow-xs transition cursor-pointer"
            >
              {isSubmitting ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>

            <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
              ¿No tienes cuenta?{' '}
              <button
                type="button"
                onClick={() => onSwitchMode('register')}
                className="font-bold text-blue-600 hover:underline cursor-pointer"
              >
                Regístrate aquí
              </button>
            </div>
          </form>
        )}

        {/* REGISTER FORM */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="p-6 pt-2 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  required
                  value={regNombre}
                  onChange={(e) => setRegNombre(e.target.value)}
                  placeholder="Mateo"
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Apellido
                </label>
                <input
                  type="text"
                  required
                  value={regApellido}
                  onChange={(e) => setRegApellido(e.target.value)}
                  placeholder="Gómez"
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nombre de usuario (Único)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs">
                  @
                </span>
                <input
                  type="text"
                  required
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="mateo_gomez"
                  className="w-full pl-7 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Correo Electrónico (Único)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Mail className="w-3.5 h-3.5" />
                </span>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="mateo@donbosco.edu.ar"
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Contraseña
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Lock className="w-3.5 h-3.5" />
                </span>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                />
              </div>
            </div>

            <p className="text-[10px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-200">
              ℹ️ Tu cuenta tendrá automáticamente rol de <strong>ALUMNO</strong> y quedará activa
              de inmediato sin necesidad de validación externa.
            </p>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 rounded-xl shadow-xs transition cursor-pointer"
            >
              {isSubmitting ? 'Registrando cuenta...' : 'Crear Cuenta de Alumno'}
            </button>

            <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
              ¿Ya tienes una cuenta?{' '}
              <button
                type="button"
                onClick={() => onSwitchMode('login')}
                className="font-bold text-blue-600 hover:underline cursor-pointer"
              >
                Inicia sesión
              </button>
            </div>
          </form>
        )}

        {/* FORGOT PASSWORD FORM */}
        {mode === 'forgot' && (
          <div className="p-6 pt-2 space-y-4">
            {forgotStep === 1 ? (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Ingresa tu correo electrónico registrado para recuperar el acceso a tu cuenta.
                </p>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="tu.email@donbosco.edu.ar"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 rounded-xl shadow-xs transition cursor-pointer"
                >
                  {isSubmitting ? 'Generando código...' : 'Solicitar código de recuperación'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Código de Recuperación
                  </label>
                  <input
                    type="text"
                    required
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    placeholder="Código recibido"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-xs transition cursor-pointer"
                >
                  {isSubmitting ? 'Restableciendo...' : 'Restablecer mi contraseña'}
                </button>
              </form>
            )}

            <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => onSwitchMode('login')}
                className="font-bold text-blue-600 hover:underline cursor-pointer"
              >
                Volver al inicio de sesión
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
