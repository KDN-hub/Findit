'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

type ModalType = 'alert' | 'confirm' | 'prompt';

interface ModalOptions {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    defaultValue?: string;
    type?: 'info' | 'warning' | 'danger' | 'success';
}

interface ModalContextType {
    showAlert: (options: ModalOptions) => Promise<void>;
    showConfirm: (options: ModalOptions) => Promise<boolean>;
    showPrompt: (options: ModalOptions) => Promise<string | null>;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider = ({ children }: { children: ReactNode }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [modalType, setModalType] = useState<ModalType>('alert');
    const [options, setOptions] = useState<ModalOptions>({ message: '' });
    const [resolver, setResolver] = useState<((value: any) => void) | null>(null);
    const [inputValue, setInputValue] = useState('');

    const showModal = useCallback((type: ModalType, opts: ModalOptions) => {
        setModalType(type);
        setOptions(opts);
        setInputValue(opts.defaultValue || '');
        setIsOpen(true);
        return new Promise<any>((resolve) => {
            setResolver(() => resolve);
        });
    }, []);

    const handleConfirm = () => {
        setIsOpen(false);
        if (resolver) {
            if (modalType === 'prompt') resolver(inputValue);
            else if (modalType === 'confirm') resolver(true);
            else resolver(undefined);
        }
    };

    const handleCancel = () => {
        setIsOpen(false);
        if (resolver) {
            if (modalType === 'prompt') resolver(null);
            else if (modalType === 'confirm') resolver(false);
            else resolver(undefined);
        }
    };

    // Close on Escape
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleCancel();
            if (e.key === 'Enter' && modalType !== 'prompt') handleConfirm();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, modalType]);

    const getIcon = () => {
        const type = options.type || (options.message.includes('DANGER') || options.confirmText?.includes('DELETE') ? 'danger' : 'info');

        switch (type) {
            case 'danger':
                return (
                    <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                );
            case 'warning':
                return (
                    <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                );
            case 'success':
                return (
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                );
            default:
                return (
                    <div className="w-12 h-12 bg-blue-100 text-[#003898] rounded-full flex items-center justify-center mb-4 mx-auto">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                );
        }
    };

    return (
        <ModalContext.Provider value={{
            showAlert: (opts) => showModal('alert', opts),
            showConfirm: (opts) => showModal('confirm', opts),
            showPrompt: (opts) => showModal('prompt', opts),
        }}>
            {children}
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-slate-100 w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 text-center">
                            {getIcon()}
                            {options.title && (
                                <h3 className="text-xl font-bold text-slate-900 mb-2">{options.title}</h3>
                            )}
                            <p className="text-slate-500 text-sm leading-relaxed px-2">{options.message}</p>

                            {modalType === 'prompt' && (
                                <div className="mt-6 text-left">
                                    <input
                                        autoFocus
                                        type="text"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#003898]/10 focus:border-[#003898] transition-all text-center font-bold text-slate-800 placeholder:font-normal placeholder:text-slate-400"
                                        placeholder="Type here..."
                                    />
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-slate-50/50 flex gap-3 px-8 pb-8">
                            {(modalType === 'confirm' || modalType === 'prompt') && (
                                <button
                                    onClick={handleCancel}
                                    className="flex-1 px-6 py-3.5 rounded-2xl text-slate-600 font-bold hover:bg-slate-200 transition-colors active:scale-95"
                                >
                                    {options.cancelText || 'Cancel'}
                                </button>
                            )}
                            <button
                                autoFocus={modalType !== 'prompt'}
                                onClick={handleConfirm}
                                className={`flex-1 px-6 py-3.5 rounded-2xl font-bold transition-all shadow-lg active:scale-95 text-white ${options.type === 'danger' || options.message.includes('DANGER') || options.confirmText?.toLowerCase().includes('delete')
                                        ? 'bg-red-600 hover:bg-red-700 shadow-red-200'
                                        : 'bg-[#003898] hover:bg-[#002b7a] shadow-blue-200'
                                    }`}
                            >
                                {options.confirmText || 'OK'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ModalContext.Provider>
    );
};

export const useModal = () => {
    const context = useContext(ModalContext);
    if (!context) throw new Error('useModal must be used within ModalProvider');
    return context;
};
