'use client';

import React, { useState, useEffect } from 'react';
import { Phone, BookUser, Check, AlertCircle } from 'lucide-react';

/**
 * Utility to format phone numbers cleanly with Brazil +55 and DDD 21 as defaults.
 * Fully editable by the user at any point.
 */
export function formatPhoneWithDefault(input) {
  if (!input) return '';
  const str = String(input);
  
  // Clean digits
  let digits = str.replace(/\D/g, '');
  if (!digits) return '';

  // If user typed only 8 or 9 digits (local number like 987654321), automatically assume DDD 21 and +55
  if (digits.length >= 8 && digits.length <= 9 && digits.startsWith('9')) {
    digits = '5521' + digits;
  } else if ((digits.length === 10 || digits.length === 11) && !digits.startsWith('55')) {
    // 11 digits like 21987654321 -> assume Brazil +55
    digits = '55' + digits;
  }

  // Format if it starts with 55 (Brazil)
  if (digits.startsWith('55')) {
    const ddd = digits.slice(2, 4);
    const rest = digits.slice(4);
    if (!ddd) return '+55 ';
    if (rest.length === 0) return `+55 (${ddd})`;
    if (rest.length <= 5) {
      return `+55 (${ddd}) ${rest}`;
    }
    return `+55 (${ddd}) ${rest.slice(0, 5)}-${rest.slice(5, 9)}`;
  }

  // General formatting for non-55 numbers
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

export default function PhoneInputWithContacts({
  value = '',
  onChange,
  onContactPick,
  placeholder = '+55 (21) 98765-4321',
  className = '',
  id,
  name = 'whatsapp',
  required = false,
  autoDefault = true,
  disabled = false,
}) {
  const [toastMessage, setToastMessage] = useState(null);

  // Auto-format initial value if it arrives unformatted from DB (e.g. "5521988887777")
  const displayValue = React.useMemo(() => {
    if (!value) return '';
    // If it's a raw unformatted number with only digits, format it nicely
    if (/^\d+$/.test(value.trim())) {
      return formatPhoneWithDefault(value);
    }
    return value;
  }, [value]);

  // Default initial value to +55 (21) when focused or if empty & autoDefault is set
  const handleFocus = (e) => {
    if (autoDefault && !e.target.value) {
      const defaultValue = '+55 (21) ';
      onChange(defaultValue);
    }
  };

  const handleChange = (e) => {
    const rawVal = e.target.value;
    
    // If user cleared everything, let it be empty
    if (!rawVal.trim()) {
      onChange('');
      return;
    }

    // Allow user to backspace freely without forced re-formatting on incomplete prefixes
    if (rawVal === '+55' || rawVal === '+55 ' || rawVal === '+55 (' || rawVal === '+') {
      onChange(rawVal);
      return;
    }

    // Format the phone number dynamically while typing
    const formatted = formatPhoneWithDefault(rawVal);
    onChange(formatted || rawVal);
  };

  const handlePickFromAgenda = async () => {
    if (typeof window === 'undefined') return;

    const isSupported = 'contacts' in navigator && 'ContactsManager' in window;
    
    if (isSupported) {
      try {
        const props = ['name', 'tel'];
        const contacts = await navigator.contacts.select(props, { multiple: false });
        if (contacts && contacts.length > 0) {
          const contact = contacts[0];
          const rawName = contact.name && contact.name[0] ? contact.name[0] : '';
          const rawTel = contact.tel && contact.tel[0] ? contact.tel[0] : '';

          if (rawTel) {
            const formattedTel = formatPhoneWithDefault(rawTel);
            onChange(formattedTel);

            if (onContactPick) {
              let firstName = '';
              let lastName = '';
              if (rawName) {
                const parts = rawName.trim().split(' ');
                firstName = parts[0] || '';
                lastName = parts.slice(1).join(' ') || '';
              }
              onContactPick({
                fullName: rawName,
                firstName,
                lastName,
                phone: formattedTel,
                rawPhone: rawTel,
              });
            }
          }
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('Erro ao selecionar contato da agenda:', err);
        }
      }
    } else {
      // Desktop or unsupported browser notification
      setToastMessage('A importação da agenda funciona em celulares (Android/iOS). No computador, por favor digite o número.');
      setTimeout(() => setToastMessage(null), 4500);
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative flex items-center">
        <div className="absolute left-3 text-slate-400 pointer-events-none flex items-center">
          <Phone className="w-4 h-4 text-emerald-400" />
        </div>

        <input
          type="tel"
          id={id}
          name={name}
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`w-full pl-9 pr-24 py-2.5 bg-[#1C1C1E] border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono ${className}`}
        />

        <button
          type="button"
          onClick={handlePickFromAgenda}
          title="Importar contato da agenda do celular"
          className="absolute right-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
        >
          <BookUser className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Agenda</span>
        </button>
      </div>

      {/* Unsupported Desktop Toast Popup */}
      {toastMessage && (
        <div className="absolute left-0 right-0 -bottom-10 z-50 p-2 bg-[#2C2C2E] border border-amber-500/30 rounded-lg text-amber-300 text-[11px] flex items-center gap-1.5 shadow-xl animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
          <span className="truncate">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
