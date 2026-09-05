import React from 'react';
import { User, Shield, CheckCircle2, Lock, ArrowRight, X, Monitor, HardDrive } from 'lucide-react';
import { AppUser } from '../types';
import { SYSTEM_USERS } from '../data/users';

interface UserLoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onLogin: (user: AppUser) => void;
  currentUser?: AppUser;
  canDismiss?: boolean;
}

export const UserLoginModal: React.FC<UserLoginModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  currentUser,
  canDismiss = true,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#141820] border border-[#2d3748] rounded-xl max-w-lg w-full shadow-2xl overflow-hidden font-sans text-slate-200 flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-[#181d26] border-b border-[#2d3748] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                Log On to Glazing System
              </h2>
              <p className="text-[11px] text-slate-400">
                Select your user account to open the Jobs Dashboard
              </p>
            </div>
          </div>
          {canDismiss && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* User Selection List */}
        <div className="p-5 space-y-3">
          <div className="text-[11px] text-slate-400">
            Choose your user profile to authenticate. You will automatically be taken to the <strong>Jobs Dashboard</strong>:
          </div>

          <div className="space-y-2.5">
            {SYSTEM_USERS.map((usr) => {
              const isSelected = currentUser?.id === usr.id;
              return (
                <button
                  key={usr.id}
                  type="button"
                  onClick={() => onLogin(usr)}
                  className={`w-full p-3.5 rounded-lg border text-left transition flex items-center justify-between group cursor-pointer ${
                    isSelected
                      ? 'bg-blue-950/60 border-blue-500 shadow-md ring-1 ring-blue-500/50'
                      : 'bg-[#181e28] border-slate-700/80 hover:bg-[#1f2633] hover:border-slate-500'
                  }`}
                  style={{ borderLeftColor: usr.color, borderLeftWidth: '4px' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-mono"
                      style={{ backgroundColor: `${usr.color}20`, color: usr.color }}
                    >
                      {usr.id.toUpperCase().replace('USER', 'U')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs sm:text-sm group-hover:text-blue-300 transition">
                          {usr.name}
                        </span>
                        <span
                          className="px-1.5 py-0.2 rounded text-[10px] uppercase font-mono font-bold"
                          style={{ backgroundColor: `${usr.color}25`, color: usr.color }}
                        >
                          {usr.role}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3" />
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {usr.id === 'user1' && 'Administrator • Full access, job locking & unlocking'}
                        {usr.id === 'user2' && 'Production Planner • Cut list input, stock optimization & job lock'}
                        {usr.id === 'user3' && 'Shop Floor / CNC Operator • Visualizer, cutting map & G-code exports'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-slate-500 group-hover:text-blue-400 transition pr-1">
                    <span className="text-[11px] font-medium hidden sm:inline">Log On</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Note */}
          <div className="mt-4 p-2.5 rounded bg-[#10141d] border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-400 shrink-0" />
            <span>
              All jobs are permanently saved on the company server. After logging in, you will be redirected directly to the <strong>Jobs Dashboard</strong>.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
