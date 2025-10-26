'use client';

interface BookingStepsProps {
  currentStep: 'select' | 'confirm' | 'payment' | 'success';
}

export default function BookingSteps({ currentStep }: BookingStepsProps) {
  const steps = [
    {
      id: 'select',
      name: 'Select Time',
      description: 'Choose your preferred appointment slot',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 'confirm',
      name: 'Confirm Details',
      description: 'Review your appointment information',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      )
    },
    {
      id: 'payment',
      name: 'Payment',
      description: 'Complete your secure payment',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      )
    },
    {
      id: 'success',
      name: 'Complete',
      description: 'Booking confirmed successfully',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )
    }
  ];

  const getStepStatus = (stepId: string) => {
    const stepIndex = steps.findIndex(step => step.id === stepId);
    const currentIndex = steps.findIndex(step => step.id === currentStep);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const status = getStepStatus(step.id);
          
          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex items-center">
                <div className={`
                  w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200
                  ${status === 'completed' 
                    ? 'bg-green-600 text-white shadow-lg' 
                    : status === 'current'
                    ? 'bg-blue-600 text-white shadow-lg ring-4 ring-blue-100'
                    : 'bg-gray-200 text-gray-600'
                  }
                `}>
                  {status === 'completed' ? (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    step.icon
                  )}
                </div>
                
                {/* Step Info */}
                <div className="ml-4 hidden sm:block">
                  <div className={`text-sm font-medium ${
                    status === 'current' ? 'text-blue-600' : 
                    status === 'completed' ? 'text-green-600' : 
                    'text-gray-500'
                  }`}>
                    {step.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {step.description}
                  </div>
                </div>
              </div>
              
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 mx-4 hidden sm:block">
                  <div className={`h-0.5 transition-all duration-200 ${
                    status === 'completed' ? 'bg-green-600' : 'bg-gray-200'
                  }`} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Mobile Step Info */}
      <div className="sm:hidden mt-4 text-center">
        <div className={`text-sm font-medium ${
          getStepStatus(currentStep) === 'current' ? 'text-blue-600' : 
          getStepStatus(currentStep) === 'completed' ? 'text-green-600' : 
          'text-gray-500'
        }`}>
          {steps.find(step => step.id === currentStep)?.name}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {steps.find(step => step.id === currentStep)?.description}
        </div>
      </div>
    </div>
  );
}