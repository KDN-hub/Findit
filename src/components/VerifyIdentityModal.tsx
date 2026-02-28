import { useState } from 'react';
import { API_BASE_URL } from '@/lib/config';

export interface VerifyIdentityModalProps {
  isOpen: boolean;
  conversationId: number;
  itemTitle?: string;
  itemId?: number;
  isFinder?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
}

export function VerifyIdentityModal({ isOpen, conversationId, itemTitle, itemId, isFinder, onClose, onSuccess }: VerifyIdentityModalProps) {
  // Never render if not open
  if (!isOpen) return null;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({
    question1: '',
    question2: '',
    question3: '',
    question4: '',
  });

  const questions = [
    {
      id: 'question1',
      question: 'What color is the item?',
      placeholder: 'e.g., Black, Silver, Blue...',
    },
    {
      id: 'question2',
      question: 'Describe any unique marks or features',
      placeholder: 'e.g., Scratches, stickers, engravings...',
    },
    {
      id: 'question3',
      question: 'Describe or tell us what your wallpaper is',
      placeholder: 'e.g., A photo of my dog, default blue lock screen...',
    },
    {
      id: 'question4',
      question: 'What was the last thing you did with the item?',
      placeholder: 'e.g., I was using it at the library...',
    },
  ];

  const currentQuestion = questions[step - 1];
  const currentAnswer = answers[currentQuestion?.id as keyof typeof answers] || '';

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      onClose?.();
    }
  };

  const handleSubmit = async () => {
    if (!itemId) return;

    setIsSubmitting(true);

    // Construct the payload as a list of answers
    const answersList = [
      answers.question1,
      answers.question2,
      answers.question3,
      answers.question4,
    ];

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        alert("You must be logged in to verify.");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/submit-verification`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answers: answersList }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to submit verification');
      }

      alert('Verification sent to chat!');
      onSuccess?.();
      onClose?.();

    } catch (error: any) {
      console.error("Verification submit error:", error);
      alert(error.message || "An error occurred during submission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 pb-24 px-4 sm:pb-0 sm:px-0"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-lg p-6 pb-8 safe-area-bottom animate-slide-up shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handleBack}
            className="w-10 h-10 bg-[#F1F5F9] rounded-full flex items-center justify-center cursor-pointer hover:bg-slate-200 transition-colors"
          >
            <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h2 className="text-lg font-bold text-[#003898]">Verify Your Identity</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-[#F1F5F9] rounded-full flex items-center justify-center cursor-pointer hover:bg-slate-200 transition-colors"
          >
            <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`flex-1 h-1.5 rounded-full transition-colors ${s <= step ? 'bg-[#003898]' : 'bg-[#E8ECF4]'
                }`}
            />
          ))}
        </div>

        {/* Item Info */}
        <div className="mb-6 p-4 bg-[#F1F5F9] rounded-xl">
          <p className="text-xs text-slate-500 mb-1">Verifying ownership of:</p>
          <p className="font-semibold text-slate-800">{itemTitle}</p>
        </div>

        {/* Question */}
        <div className="mb-6">
          <p className="text-sm text-slate-500 mb-1">Question {step} of 4</p>
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            {currentQuestion?.question}
          </h3>
          <textarea
            value={currentAnswer}
            onChange={(e) => setAnswers({ ...answers, [currentQuestion.id]: e.target.value })}
            placeholder={currentQuestion?.placeholder}
            rows={4}
            className="w-full px-4 py-3 bg-[#F1F5F9] rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#003898] transition-all resize-none"
          />
        </div>

        {/* Submit Button */}
        <button
          onClick={handleNext}
          disabled={isSubmitting || !currentAnswer.trim()}
          className="w-full h-14 bg-[#003898] hover:bg-[#002266] text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Submitting...
            </>
          ) : step < 4 ? (
            'Next Question'
          ) : (
            'Submit Verification' 
          )}
        </button>

        <p className="mt-4 text-xs text-slate-500 text-center">
          The finder will review your answers to verify ownership.
        </p>
      </div>
    </div>
  );
}
