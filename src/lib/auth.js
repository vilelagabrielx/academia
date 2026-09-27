import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.SECRET_KEY || 'super-secret-gym-key-12345';

export function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      is_staff: user.is_staff,
      is_superuser: user.is_superuser,
      photo_base64: user.photo_base64,
      whatsapp: user.whatsapp,
    },
    JWT_SECRET,
    { expiresIn: '365d' }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

export async function getSessionUser() {
  const cookieStore = cookies();
  const token = cookieStore.get('gym_session')?.value;
  if (!token) return null;
  return verifyToken(token);
}
