import React, { useState } from 'react';
import { TestCase } from '../../types/knowledge';
import {
  Search,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Send,
  SlidersHorizontal,
} from 'lucide-react';

interface KnowledgeTestingViewProps {
  testCases: TestCase[];
  onAddTestCase: (testCase: TestCase) => void;
  onUpdateVerdict: (id: string, verdict: 'correct' | 'incorrect' | 'incomplete') => void;
}

const PRESET_QUESTIONS = [
  {
    q: 'ভাই ঢাকার বাইরে সুন্দরবন কুরিয়ারে পাঠালে কতদিন লাগবে?',
    desc: 'Delivery SLA & Courier inquiry',
  },
  {
    q: 'পণ্য ভাঙা আসলে আমি কি পুরো টাকা ক্যাশ রিফান্ড পাব?',
    desc: 'Damage refund policy & human escalation check',
  },
  {
    q: 'আমরা ১০০ পিস কিনলে কত পার্সেন্ট ডিসকাউন্ট দেবেন?',
    desc: 'Wholesale pricing rule constraint check',
  },
  {
    q: 'bKash এ পেমেন্ট করার অফিসিয়াল মার্চেন্ট নম্বর কত?',
    desc: 'Payment security & merchant validation FAQ',
  },
];

export const KnowledgeTestingView: React.FC<KnowledgeTestingViewProps> = ({
  testCases,
  onAddTestCase,
  onUpdateVerdict,
}) => {
  const [questionInput, setQuestionInput] = useState('');
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [currentTestResult, setCurrentTestResult] = useState<TestCase | null>(
    testCases[0] || null
  );
  const [filterVerdict, setFilterVerdict] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleRunTest = (qToTest?: string) => {
    const q = (qToTest || questionInput).trim();
    if (!q) return;

    setIsRunningTest(true);

    setTimeout(() => {
      // Simulate retrieval and grounded generation
      let simulatedResult: TestCase;

      if (q.includes('ঢাকার') || q.includes('ডেলিভারি') || q.includes('delivery')) {
        simulatedResult = {
          id: `test_${Date.now()}`,
          question: q,
          draftAnswer:
            'ঢাকার ভেতরে ডেলিভারি চার্জ ৬০ টাকা (২৪-৪৮ ঘণ্টা) এবং ঢাকার বাইরে ১২০ টাকা (৪৮-৭২ ঘণ্টা)। সুন্দরবন বা স্টেডফাস্ট কুরিয়ারের মাধ্যমে নিরাপদে পাঠানো হয়।',
          retrievedSources: [
            {
              title: 'Delivery Fees and Courier Timeline Policy',
              passage:
                'MUST: Quote 60 BDT for inside Dhaka and 120 BDT for outside Dhaka. Delivery turnaround is 24-48 hours inside Dhaka and 48-72 hours outside Dhaka.',
              relevanceScore: 0.96,
            },
            {
              title: 'Standard Delivery & Courier Guidelines 2026.pdf',
              passage:
                'Outside Dhaka shipments are routed through Sundarban or Steadfast courier networks at 120 BDT flat fee.',
              relevanceScore: 0.91,
            },
          ],
          isGrounded: true,
          expectedAnswer: '৬০ টাকা ভিতরে, ১২০ টাকা বাইরে।',
          verdict: 'untested',
          testedAt: 'Just now',
        };
      } else if (q.includes('রিফান্ড') || q.includes('ভাঙা') || q.includes('refund') || q.includes('defective')) {
        simulatedResult = {
          id: `test_${Date.now()}`,
          question: q,
          draftAnswer:
            'পণ্য পৌঁছানোর ৭২ ঘণ্টার মধ্যে আনবক্সিং ছবি বা ভিডিও পাঠালে আমরা বিনামূল্যে নতুন পিস পাঠিয়ে এক্সচেঞ্জ করে দিই। ক্যাশ রিফান্ডের ক্ষেত্রে কোনো সিদ্ধান্ত নেওয়ার পূর্বে স্টাফ রিভিউ বাধ্যতামূলক, তাই আমি একজন টিমমেটকে যুক্ত করে দিচ্ছি।',
          retrievedSources: [
            {
              title: 'Product Returns and Damage Replacement Policy',
              passage:
                'MUST NOT: Promise full cash refunds directly in chat without manager review unless replacement is out of stock. Defective items qualify for free replacement.',
              relevanceScore: 0.93,
            },
          ],
          isGrounded: true,
          expectedAnswer: 'বিনামূল্যে এক্সচেঞ্জ অফার করবে, রিফান্ডের জন্য স্টাফ কল করবে।',
          verdict: 'untested',
          testedAt: 'Just now',
        };
      } else if (q.includes('ডিসকাউন্ট') || q.includes('bulk') || q.includes('পাইকারি')) {
        simulatedResult = {
          id: `test_${Date.now()}`,
          question: q,
          draftAnswer:
            '২০ পিসের বেশি অর্ডারের জন্য আমাদের আকর্ষণীয় কর্পোরেট ও পাইকারি ছাড় রয়েছে। আপনার বাজেট ও কোয়ান্টিটি অনুযায়ী চূড়ান্ত কোটেশন দিতে আপনার ফোন নম্বর বা অফিসিয়াল ইমেইল শেয়ার করুন, সেলস ম্যানেজার সরাসরি যোগাযোগ করবেন।',
          retrievedSources: [
            {
              title: 'B2B Wholesale and Custom Bulk Pricing Policy',
              passage:
                'Retail pricing applies to all orders under 20 units. For corporate or wholesale orders of 20 units or more, customized slab discounts apply. AI must collect contact.',
              relevanceScore: 0.94,
            },
          ],
          isGrounded: true,
          expectedAnswer: 'নির্দিষ্ট রেট গোপন রেখে লিড কালেক্ট করবে।',
          verdict: 'untested',
          testedAt: 'Just now',
        };
      } else {
        simulatedResult = {
          id: `test_${Date.now()}`,
          question: q,
          draftAnswer:
            `আপনার প্রশ্নটির জন্য আমাদের নলেজ বেসের তথ্যের ভিত্তিতে উত্তর তৈরি করা হয়েছে। বিস্তারিত জানতে আমাদের কাস্টমার কেয়ার টিমও সহায়তা করতে প্রস্তুত।`,
          retrievedSources: [
            {
              title: 'Official Store Knowledge Base v2.4',
              passage:
                'Standard customer assistance procedures apply across all general inquiries.',
              relevanceScore: 0.82,
            },
          ],
          isGrounded: true,
          verdict: 'untested',
          testedAt: 'Just now',
        };
      }

      setCurrentTestResult(simulatedResult);
      onAddTestCase(simulatedResult);
      setIsRunningTest(false);
      setQuestionInput('');
    }, 600);
  };

  const filteredTests = testCases.filter((t) => {
    if (filterVerdict !== 'all' && t.verdict !== filterVerdict) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.question.toLowerCase().includes(q) ||
        t.draftAnswer.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Test Sandbox */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Interactive Knowledge Simulator</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulate customer queries in real-time to inspect retrieved sources, similarity scores, and policy rule compliance before publishing.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-slate-400">Current Knowledge State:</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
              v2.5-draft (Staging)
            </span>
          </div>
        </div>

        {/* Input box */}
        <div className="relative">
          <textarea
            value={questionInput}
            onChange={(e) => setQuestionInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleRunTest();
              }
            }}
            placeholder="Type a test customer question in Bangla or English (e.g. ডেলিভারি কতদিন লাগবে? বা রিফান্ড পলিসি কী?)..."
            rows={2}
            className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 placeholder:text-slate-400 resize-none"
          />
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-slate-400 font-medium">Quick suggestions:</span>
              {PRESET_QUESTIONS.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setQuestionInput(item.q);
                    handleRunTest(item.q);
                  }}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  {item.desc}
                </button>
              ))}
            </div>

            <button
              type="button"
              disabled={isRunningTest || !questionInput.trim()}
              onClick={() => handleRunTest()}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors shadow-xs"
            >
              {isRunningTest ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                  <span>Retrieving Knowledge Chunks...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Run Retrieval Test</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Current Active Simulation Result */}
        {currentTestResult && (
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Simulation Output
                </span>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg flex items-center gap-1 ${
                    currentTestResult.isGrounded
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  <ShieldCheck className="w-3 h-3" />
                  {currentTestResult.isGrounded ? 'Fully Grounded' : 'Ungrounded Notice'}
                </span>
              </div>

              {/* Verdict Buttons */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400 mr-1">Quality Verdict:</span>
                <button
                  type="button"
                  onClick={() => onUpdateVerdict(currentTestResult.id, 'correct')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1 ${
                    currentTestResult.verdict === 'correct'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Correct
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateVerdict(currentTestResult.id, 'incomplete')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1 ${
                    currentTestResult.verdict === 'incomplete'
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Incomplete
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateVerdict(currentTestResult.id, 'incorrect')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1 ${
                    currentTestResult.verdict === 'incorrect'
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Incorrect
                </button>
              </div>
            </div>

            {/* Question & Answer Box */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-7 space-y-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Input Prompt
                  </span>
                  <p className="text-xs font-semibold text-slate-900">
                    "{currentTestResult.question}"
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50/40 border border-indigo-100 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                    AI Agent Draft Response
                  </span>
                  <p className="text-xs text-slate-800 leading-relaxed font-sans">
                    {currentTestResult.draftAnswer}
                  </p>
                </div>

                {currentTestResult.expectedAnswer && (
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5 px-2">
                    <span className="font-semibold text-slate-700">Golden Expected Target:</span>
                    <span>{currentTestResult.expectedAnswer}</span>
                  </div>
                )}
              </div>

              {/* Retrieved Sources & Chunks */}
              <div className="lg:col-span-5 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Cited Grounding Chunks ({currentTestResult.retrievedSources.length})
                </span>

                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {currentTestResult.retrievedSources.map((source, sIdx) => (
                    <div
                      key={sIdx}
                      className="p-3 rounded-xl bg-white border border-slate-200 text-xs space-y-1.5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <BookOpen className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span className="font-semibold text-slate-900 truncate">
                            {source.title}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 shrink-0 font-mono">
                          {Math.round(source.relevanceScore * 100)}% match
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-mono bg-slate-50 p-2 rounded-lg leading-relaxed border border-slate-100">
                        "{source.passage}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Regression & Historical Test Suite */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              QA Test Bench & Regression Cases ({filteredTests.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Historical validation records to safeguard business logic against hallucination before snapshot publication.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative w-48 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search test runs..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
              />
            </div>

            {/* Verdict Filter */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {['all', 'correct', 'incomplete', 'incorrect'].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setFilterVerdict(v)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg capitalize transition-colors ${
                    filterVerdict === v
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* List of Test Cases */}
        <div className="divide-y divide-slate-100">
          {filteredTests.map((tc) => (
            <div
              key={tc.id}
              onClick={() => setCurrentTestResult(tc)}
              className="p-4 hover:bg-slate-50/70 transition-colors cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3"
            >
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-900 truncate">
                    {tc.question}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md capitalize ${
                      tc.verdict === 'correct'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : tc.verdict === 'incomplete'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : tc.verdict === 'incorrect'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tc.verdict}
                  </span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-1">
                  Draft reply: "{tc.draftAnswer}"
                </p>
                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span>Tested: {tc.testedAt}</span>
                  <span>Sources: {tc.retrievedSources.length} cited</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateVerdict(tc.id, 'correct');
                  }}
                  className={`p-1.5 rounded-lg border text-xs ${
                    tc.verdict === 'correct'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                  title="Mark Correct"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateVerdict(tc.id, 'incorrect');
                  }}
                  className={`p-1.5 rounded-lg border text-xs ${
                    tc.verdict === 'incorrect'
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                  title="Mark Incorrect"
                >
                  <XCircle className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {filteredTests.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-400">
              No test cases found matching your criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
