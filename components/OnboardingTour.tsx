"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface OnboardingTourProps {
  steps: TourStep[];
  onComplete: () => void;
  onSkip: () => void;
}

export function OnboardingTour({
  steps,
  onComplete,
  onSkip,
}: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    setTimeout(() => {
      onComplete();
    }, 300);
  };

  const handleSkipTour = () => {
    setIsVisible(false);
    setTimeout(() => {
      onSkip();
    }, 300);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[10000]"
            onClick={handleSkipTour}
          />

          {/* Tour Card */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[10001] w-full max-w-lg mx-4"
          >
            <Card className="shadow-2xl border-2 border-emerald-500 bg-white dark:bg-slate-900">
              <CardContent className="p-0">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-emerald-500 to-teal-500">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-emerald-600 font-bold text-lg shadow-lg">
                      {currentStep + 1}
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-white">
                        {steps[currentStep].title}
                      </h3>
                      <p className="text-sm text-white/90 font-semibold">
                        Step {currentStep + 1} of {steps.length}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSkipTour}
                    className="text-white hover:text-white hover:bg-white/20"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* Content */}
                <div className="p-8 bg-white dark:bg-slate-900">
                  {currentStep === 0 && (
                    <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">🚀</div>
                        <div>
                          <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-1">
                            Beta Version
                          </h4>
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            We're now in beta! We're continuously changing the
                            code to improve your experience. Take the tour for
                            updates or skip it 😊
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="mb-6 text-center">
                    <div className="w-20 h-20 mx-auto mb-4 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
                      {steps[currentStep].icon}
                    </div>
                  </div>
                  <p className="text-gray-900 dark:text-white text-center text-lg font-medium leading-relaxed mb-6">
                    {steps[currentStep].description}
                  </p>

                  {/* Action Button (if provided) */}
                  {steps[currentStep].action && (
                    <Button
                      variant="outline"
                      className="w-full mb-4 font-semibold"
                      onClick={steps[currentStep].action!.onClick}
                    >
                      {steps[currentStep].action!.label}
                    </Button>
                  )}
                </div>

                {/* Progress Dots */}
                <div className="px-8 pb-4 bg-white dark:bg-slate-900 flex items-center justify-center gap-2">
                  {steps.map((_, index) => (
                    <div
                      key={index}
                      className={`h-2 rounded-full transition-all ${
                        index === currentStep
                          ? "w-8 bg-emerald-600"
                          : index < currentStep
                          ? "w-2 bg-emerald-400"
                          : "w-2 bg-gray-300 dark:bg-gray-600"
                      }`}
                    />
                  ))}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 flex items-center justify-between gap-4">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentStep === 0}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleSkipTour}
                    className="text-gray-600"
                  >
                    Skip Tour
                  </Button>
                  <Button
                    onClick={handleNext}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
                  >
                    {currentStep === steps.length - 1 ? (
                      <>
                        <Check className="w-4 h-4" />
                        Finish
                      </>
                    ) : (
                      <>
                        Next
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
