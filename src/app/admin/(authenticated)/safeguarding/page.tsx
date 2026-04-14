import Link from "next/link";
import { getAdminSession } from "@/lib/session";
import { getSchoolSettings } from "@/lib/school";
import { MODERATION_KEYWORDS } from "@/lib/surveys";

// Group keywords by category for display
const KEYWORD_GROUPS: { title: string; description: string; words: string[] }[] = [
  {
    title: "Self-harm",
    description: "Phrases indicating thoughts of suicide or self-injury",
    words: [
      "kill myself", "kill my self", "suicide", "suicidal", "end my life", "want to die",
      "hurt myself", "cut myself", "cutting myself", "self harm", "self-harm", "harm myself",
    ],
  },
  {
    title: "Abuse",
    description: "Phrases that may indicate physical or sexual abuse",
    words: [
      "abuse", "abused", "abusing", "hit me", "hits me", "hurts me", "touching me",
      "inappropriate touching", "hurt at home",
    ],
  },
  {
    title: "Severe bullying / isolation",
    description: "Phrases indicating social isolation or persistent bullying",
    words: [
      "bullied every day", "hate myself", "no one likes me", "nobody likes me",
    ],
  },
  {
    title: "Other concerns",
    description: "Phrases that warrant follow-up (neglect, eating, running away)",
    words: [
      "run away", "running away", "starving", "not eating",
    ],
  },
];

export default async function SafeguardingDocsPage() {
  const session = await getAdminSession();
  const school = await getSchoolSettings(session.schoolId);

  // Sanity check that every documented keyword is actually in the live list.
  // (If someone adds to MODERATION_KEYWORDS without updating this page, the
  // audit section below will flag it.)
  const documentedSet = new Set(KEYWORD_GROUPS.flatMap((g) => g.words));
  const undocumented = MODERATION_KEYWORDS.filter((k) => !documentedSet.has(k));

  return (
    <div className="max-w-3xl">
      <Link href="/admin/settings" className="text-sm text-meq-sky hover:underline">
        &larr; Back to Settings
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-1">Safeguarding &amp; DSL Alerts</h1>
      <p className="text-gray-500 mb-6">
        How MeQ automatically flags potentially concerning responses and notifies your
        Designated Safeguarding Lead.
      </p>

      {/* DSL status */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="font-bold text-gray-900 mb-2">Your DSL email</h2>
        {school.dslEmail ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-900 font-mono">{school.dslEmail}</p>
              <p className="text-xs text-gray-500 mt-1">This address receives all automatic alerts.</p>
            </div>
            <Link href="/admin/settings" className="text-sm text-meq-sky hover:underline">
              Change
            </Link>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-amber-900">No DSL email set</p>
              <p className="text-xs text-amber-800 mt-1">
                Automatic safeguarding alerts are paused. Set a DSL email in <Link href="/admin/settings" className="underline">Settings</Link> to turn them on.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* What triggers an alert */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="font-bold text-gray-900 mb-4">What triggers an alert?</h2>

        <div className="space-y-5">
          <div>
            <p className="font-semibold text-sm text-gray-900">Weekly Pulse</p>
            <p className="text-sm text-gray-600 mt-1">
              If a student scores <strong>2 or below (out of 5)</strong> on any domain in their weekly check-in,
              an alert is sent to the DSL. The alert lists each low-scoring domain and the student&apos;s
              free-text comment if they left one.
            </p>
          </div>

          <div>
            <p className="font-semibold text-sm text-gray-900">Custom survey responses</p>
            <p className="text-sm text-gray-600 mt-1">
              Any free-text answer in a custom survey is checked against a list of safeguarding keywords
              (see below). If any keyword is matched, the response is flagged in the admin dashboard
              and an alert is emailed to the DSL. For anonymous surveys the alert includes the flagged
              text but cannot identify the student.
            </p>
          </div>
        </div>
      </div>

      {/* Keyword list */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="font-bold text-gray-900 mb-2">Safeguarding keyword list</h2>
        <p className="text-sm text-gray-500 mb-4">
          These are the exact phrases MeQ scans for in free-text responses. Matching is case-insensitive
          and substring-based — so &quot;I want to die inside&quot; matches &quot;want to die&quot;.
        </p>

        <div className="space-y-4">
          {KEYWORD_GROUPS.map((group) => (
            <div key={group.title} className="border border-gray-100 rounded-lg p-4">
              <p className="font-semibold text-sm text-gray-900">{group.title}</p>
              <p className="text-xs text-gray-500 mt-0.5 mb-3">{group.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {group.words.map((word) => (
                  <code key={word} className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-800 font-mono">
                    {word}
                  </code>
                ))}
              </div>
            </div>
          ))}
        </div>

        {undocumented.length > 0 && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
            <p className="font-semibold">Undocumented keywords in use:</p>
            <p className="mt-1">{undocumented.join(", ")}</p>
          </div>
        )}

        <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600">
          <strong>Important:</strong> Keyword matching is a safety net, not a substitute for professional
          judgement. Follow your school&apos;s safeguarding procedures for every flagged response, and don&apos;t
          rely on this list alone — students may express concerns in ways the list doesn&apos;t catch.
        </div>
      </div>

      {/* Email preview */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="font-bold text-gray-900 mb-2">What the DSL sees</h2>
        <p className="text-sm text-gray-500 mb-4">
          Preview of the two email templates sent to your DSL.
        </p>

        <div className="space-y-4">
          <details className="border border-gray-200 rounded-lg overflow-hidden">
            <summary className="px-4 py-3 bg-gray-50 cursor-pointer text-sm font-medium text-gray-900">
              Pulse alert example
            </summary>
            <div className="p-4 space-y-2 bg-white">
              <p className="text-xs text-gray-500">Subject:</p>
              <p className="text-sm font-mono bg-gray-50 px-3 py-2 rounded">⚠️ Safeguarding alert — Jane Doe ({school.name})</p>
              <p className="text-xs text-gray-500 mt-3">Contains:</p>
              <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
                <li>Student name, year group, class</li>
                <li>Every domain scored 2 or lower, with exact score</li>
                <li>Student&apos;s free-text comment (verbatim) if given</li>
                <li>Link to <Link href="/admin/pulse" className="text-meq-sky hover:underline">/admin/pulse</Link></li>
              </ul>
            </div>
          </details>

          <details className="border border-gray-200 rounded-lg overflow-hidden">
            <summary className="px-4 py-3 bg-gray-50 cursor-pointer text-sm font-medium text-gray-900">
              Survey alert example
            </summary>
            <div className="p-4 space-y-2 bg-white">
              <p className="text-xs text-gray-500">Subject:</p>
              <p className="text-sm font-mono bg-gray-50 px-3 py-2 rounded">⚠️ Safeguarding alert — &quot;Term 1 Feedback&quot; response flagged ({school.name})</p>
              <p className="text-xs text-gray-500 mt-3">Contains:</p>
              <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
                <li>Survey title</li>
                <li>Student name + year/class — OR &quot;Anonymous&quot; for anonymous surveys</li>
                <li>Which keyword(s) matched (e.g. &quot;want to die, hurts me&quot;)</li>
                <li>The flagged text verbatim</li>
                <li>Link to the survey results page</li>
                <li>For anonymous surveys: a note that the student cannot be identified</li>
              </ul>
            </div>
          </details>
        </div>
      </div>

      {/* What doesn't get flagged */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="font-bold text-gray-900 mb-2">What does NOT trigger an alert</h2>
        <ul className="text-sm text-gray-700 space-y-1.5 list-disc pl-5">
          <li>Framework assessment (MeQ termly) scores — these are expected and visible only to leadership</li>
          <li>Staff wellbeing assessments or pulses — these are private to the individual staff member</li>
          <li>Likert / rating / multiple-choice answers in custom surveys (only free text is scanned)</li>
          <li>Responses without a DSL email configured</li>
        </ul>
      </div>
    </div>
  );
}
