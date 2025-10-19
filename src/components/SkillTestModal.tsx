import { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import type { SkillTest, Question } from '../data/testQuestions';

interface SkillTestModalProps {
  test: SkillTest;
  onComplete: (score: number, duration: number) => void;
  onCancel: () => void;
  loading: boolean;
}

export const SkillTestModal = ({ test, onComplete, onCancel, loading }: SkillTestModalProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(test.questions.length).fill(null));
  const [timeRemaining, setTimeRemaining] = useState(test.duration * 60); 
  const [testStartTime] = useState(Date.now());
  const [showResults, setShowResults] = useState(false);
  const [showWarning, setShowWarning] = useState(true);

  
  useEffect(() => {
    if (showWarning) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showWarning]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);
  };

  const calculateScore = () => {
    let correct = 0;
    test.questions.forEach((question, index) => {
      if (answers[index] === question.correctAnswer) {
        correct++;
      }
    });
    return Math.round((correct / test.questions.length) * 100);
  };

  const handleSubmit = () => {
    const score = calculateScore();
    const duration = Math.floor((Date.now() - testStartTime) / 1000);
    setShowResults(true);

    
    setTimeout(() => {
      onComplete(score, duration);
    }, 2000);
  };

  const handleStartTest = () => {
    setShowWarning(false);
  };

  const getTimeColor = () => {
    const percentage = (timeRemaining / (test.duration * 60)) * 100;
    if (percentage > 50) return 'text-green-400';
    if (percentage > 25) return 'text-yellow-400';
    return 'text-red-400';
  };

  const answeredCount = answers.filter(a => a !== null).length;
  const progress = (answeredCount / test.questions.length) * 100;

  if (showWarning) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="glass-card p-8 max-w-2xl w-full space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-2xl font-bold">{test.title}</h3>
              <p className="text-gray-400 mt-1">Read carefully before starting</p>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-400 mb-2 flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5" />
                <span>Important Instructions</span>
              </h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• You have <strong>{test.duration} minutes</strong> to complete the test</li>
                <li>• Minimum <strong>{test.passingScore}% score</strong> required to pass</li>
                <li>• <strong>{test.questions.length} questions</strong> total</li>
                <li>• Once started, the timer cannot be paused</li>
                <li>• You can navigate between questions</li>
                <li>• Submit when ready or time runs out</li>
              </ul>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <h4 className="font-semibold text-blue-400 mb-2">What happens after?</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Your score will be recorded on-chain</li>
                <li>• If you pass, a badge NFT will be minted</li>
                <li>• Badge unlocks exclusive job opportunities</li>
                <li>• You can retake the test to improve your score</li>
              </ul>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={handleStartTest}
              className="btn-primary flex-1"
            >
              Start Test
            </button>
            <button
              onClick={onCancel}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showResults) {
    const score = calculateScore();
    const passed = score >= test.passingScore;

    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="glass-card p-8 max-w-2xl w-full space-y-6 text-center">
          {passed ? (
            <>
              <CheckCircle className="w-20 h-20 mx-auto text-green-400" />
              <h3 className="text-3xl font-bold text-green-400">Congratulations!</h3>
              <p className="text-xl">You passed with {score}%</p>
            </>
          ) : (
            <>
              <XCircle className="w-20 h-20 mx-auto text-red-400" />
              <h3 className="text-3xl font-bold text-red-400">Not Quite</h3>
              <p className="text-xl">You scored {score}% (Need {test.passingScore}%)</p>
            </>
          )}

          {loading && (
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Processing your results...</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  const question = test.questions[currentQuestion];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="glass-card p-6 md:p-8 max-w-3xl w-full space-y-6 my-8">
        
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl md:text-2xl font-bold">{test.title}</h3>
            <p className="text-sm text-gray-400">
              Question {currentQuestion + 1} of {test.questions.length}
            </p>
          </div>
          <div className={`flex items-center space-x-2 ${getTimeColor()} font-bold`}>
            <Clock className="w-5 h-5" />
            <span>{formatTime(timeRemaining)}</span>
          </div>
        </div>

        
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-400">
            <span>Progress</span>
            <span>{answeredCount} / {test.questions.length} answered</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div
              className="bg-primary-500 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        
        <div className="space-y-4">
          <div className="bg-white/5 p-6 rounded-lg">
            <h4 className="text-lg font-semibold mb-4">{question.question}</h4>
            <div className="space-y-3">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    answers[currentQuestion] === index
                      ? 'border-primary-500 bg-primary-500/20'
                      : 'border-white/10 bg-white/5 hover:border-primary-500/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      answers[currentQuestion] === index
                        ? 'border-primary-500 bg-primary-500'
                        : 'border-white/30'
                    }`}>
                      {answers[currentQuestion] === index && (
                        <CheckCircle className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <span>{option}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        
        <div className="flex flex-wrap gap-2">
          {test.questions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentQuestion(index)}
              className={`w-10 h-10 rounded-lg font-medium transition-all ${
                index === currentQuestion
                  ? 'bg-primary-500 text-white'
                  : answers[index] !== null
                  ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                  : 'bg-white/5 text-gray-400 border border-white/10 hover:border-white/30'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>

        
        <div className="flex space-x-4">
          {currentQuestion > 0 && (
            <button
              onClick={() => setCurrentQuestion(currentQuestion - 1)}
              className="btn-secondary"
            >
              Previous
            </button>
          )}
          {currentQuestion < test.questions.length - 1 ? (
            <button
              onClick={() => setCurrentQuestion(currentQuestion + 1)}
              className="btn-primary flex-1"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="btn-primary flex-1"
              disabled={answeredCount < test.questions.length}
            >
              {answeredCount < test.questions.length
                ? `Answer ${test.questions.length - answeredCount} more question${test.questions.length - answeredCount !== 1 ? 's' : ''}`
                : 'Submit Test'
              }
            </button>
          )}
        </div>

        
        {answeredCount < test.questions.length && currentQuestion === test.questions.length - 1 && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <p className="text-sm text-yellow-400">
              <strong>Note:</strong> You have {test.questions.length - answeredCount} unanswered question{test.questions.length - answeredCount !== 1 ? 's' : ''}.
              Unanswered questions will be marked incorrect.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};