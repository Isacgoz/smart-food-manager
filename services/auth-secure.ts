/**
 * Secure Authentication Service - Production Ready
 * - bcrypt pour passwords
 * - JWT pour sessions
 * - RLS multi-tenant
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from './storage';
import { logger } from '../shared/services/logger';
import type { User, Restaurant } from '../types';

const JWT_SECRET = import.meta.env.VITE_JWT_SECRET || 'dev-secret-CHANGE-IN-PRODUCTION';
const SALT_ROUNDS = 10;

export interface AuthResponse {
  success: boolean;
  user?: User;
  restaurant?: Restaurant;
  token?: string;
  error?: string;
}

// ============================================
// PASSWORD HASHING (bcrypt)
// ============================================

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

// ============================================
// JWT TOKENS
// ============================================

export const generateToken = (user: any, companyId: string): string => {
  return jwt.sign(
    {
      userId: user.id,
      companyId,
      role: user.role,
      email: user.email
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    logger.warn('Invalid JWT', { error: (err as Error).message });
    return null;
  }
};

// ============================================
// EMAIL/PASSWORD LOGIN (Web Admin)
// ============================================

export const loginWithEmail = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  if (!supabase) {
    return { success: false, error: 'Database offline' };
  }

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select(`*, companies:company_id (*)`)
      .eq('email', email)
      .eq('status', 'active')
      .single();

    if (error || !user) {
      return { success: false, error: 'Email ou mot de passe incorrect' };
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return { success: false, error: 'Email ou mot de passe incorrect' };
    }

    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id);

    const token = generateToken(user, user.company_id);

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        pin: user.pin
      },
      restaurant: {
        id: user.companies.id,
        name: user.companies.name,
        plan: user.companies.plan,
        siren: user.companies.siren,
        siret: user.companies.siret
      },
      token
    };
  } catch (err) {
    logger.error('Login error', err as Error, { email });
    return { success: false, error: 'Erreur serveur' };
  }
};

// ============================================
// PIN LOGIN (Mobile Servers)
// ============================================

export const loginWithPIN = async (
  companyId: string,
  pin: string
): Promise<AuthResponse> => {
  if (!supabase) {
    return { success: false, error: 'Database offline' };
  }

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select(`*, companies:company_id (*)`)
      .eq('company_id', companyId)
      .eq('pin', pin)
      .eq('status', 'active')
      .in('role', ['SERVER', 'COOK'])
      .single();

    if (error || !user) {
      return { success: false, error: 'Code PIN incorrect' };
    }

    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id);

    const token = generateToken(user, companyId);

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        pin: user.pin
      },
      restaurant: {
        id: user.companies.id,
        name: user.companies.name,
        plan: user.companies.plan
      },
      token
    };
  } catch (err) {
    logger.error('PIN login error', err as Error, { companyId });
    return { success: false, error: 'Erreur serveur' };
  }
};

// ============================================
// USER REGISTRATION
// ============================================

export const registerUser = async (
  companyId: string,
  userData: {
    email?: string;
    password?: string;
    pin?: string;
    name: string;
    role: 'OWNER' | 'MANAGER' | 'SERVER' | 'COOK';
  }
): Promise<AuthResponse> => {
  if (!supabase) {
    return { success: false, error: 'Database offline' };
  }

  try {
    const passwordHash = userData.password ? await hashPassword(userData.password) : null;

    const { data: user, error } = await supabase
      .from('users')
      .insert({
        company_id: companyId,
        email: userData.email,
        password_hash: passwordHash,
        pin: userData.pin,
        name: userData.name,
        role: userData.role
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'Email déjà utilisé' };
      }
      throw error;
    }

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        pin: user.pin
      }
    };
  } catch (err) {
    logger.error('Registration error', err as Error, { companyId });
    return { success: false, error: 'Erreur création utilisateur' };
  }
};

// ============================================
// SESSION MANAGEMENT
// ============================================

export const saveSession = (user: User, restaurant: Restaurant, token: string) => {
  localStorage.setItem('auth_token', token);
  localStorage.setItem('current_user', JSON.stringify(user));
  localStorage.setItem('current_restaurant', JSON.stringify(restaurant));
};

export const loadSession = (): { user: User | null; restaurant: Restaurant | null; token: string | null } => {
  const token = localStorage.getItem('auth_token');
  const userStr = localStorage.getItem('current_user');
  const restaurantStr = localStorage.getItem('current_restaurant');

  if (!token || !userStr || !restaurantStr) {
    return { user: null, restaurant: null, token: null };
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    clearSession();
    return { user: null, restaurant: null, token: null };
  }

  return {
    user: JSON.parse(userStr),
    restaurant: JSON.parse(restaurantStr),
    token
  };
};

export const clearSession = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('current_user');
  localStorage.removeItem('current_restaurant');
};

// ============================================
// PASSWORD CHANGE
// ============================================

export const changePassword = async (
  userId: string,
  oldPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> => {
  if (!supabase) {
    return { success: false, error: 'Database offline' };
  }

  try {
    const { data: user } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', userId)
      .single();

    if (!user) {
      return { success: false, error: 'Utilisateur non trouvé' };
    }

    const valid = await verifyPassword(oldPassword, user.password_hash);
    if (!valid) {
      return { success: false, error: 'Ancien mot de passe incorrect' };
    }

    const newHash = await hashPassword(newPassword);

    const { error } = await supabase
      .from('users')
      .update({ password_hash: newHash })
      .eq('id', userId);

    if (error) throw error;

    return { success: true };
  } catch (err) {
    logger.error('Password change error', err as Error, { userId });
    return { success: false, error: 'Erreur changement mot de passe' };
  }
};
