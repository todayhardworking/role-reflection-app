"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useUser } from "@/context/UserContext";

type PublicReflection = {
  id: string;
  title: string;
  text: string;
  rolesInvolved: string[];
  likes: number;
};

function usePublicReflections(shouldFetch: boolean) {
  const [reflections, setReflections] = useState<PublicReflection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shouldFetch) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const loadReflections = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/publicReflections");

        if (!response.ok) {
          throw new Error("Failed to load public reflections");
        }

        const data: { reflections?: PublicReflection[] } = await response.json();

        if (!isMounted) return;

        setReflections(data.reflections?.slice(0, 3) ?? []);
        setError(null);
      } catch (err) {
        if (!isMounted) return;

        setError(err instanceof Error ? err.message : "Unable to load reflections");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadReflections();

    return () => {
      isMounted = false;
    };
  }, [shouldFetch]);

  return { reflections, loading, error };
}

function ReflectionPreviewList({
  reflections,
  loading,
  error,
}: {
  reflections: PublicReflection[];
  loading: boolean;
  error: string | null;
}) {
  const previewed = useMemo(() => reflections.slice(0, 3), [reflections]);

  if (loading) {
    return <p className="text-sm text-slate-500">Loading public reflections...</p>;
  }

  if (error) {
    return <p className="text-sm text-rose-500">{error}</p>;
  }

  if (!previewed.length) {
    return <p className="text-sm text-slate-500">No public reflections yet. Be the first to share.</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {previewed.map((reflection) => {
        const previewText = reflection.text.length > 160
          ? `${reflection.text.slice(0, 157)}...`
          : reflection.text;

        return (
          <div
            key={reflection.id}
            className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-semibold text-slate-900">{reflection.title}</h3>
                <span className="rounded-full bg-slate-50 px-2.5 py-1 text-xs text-slate-600">👍 {reflection.likes}</span>
              </div>
              <p className="text-sm leading-relaxed text-slate-600">{previewText}</p>
              {reflection.rolesInvolved?.length ? (
                <div className="flex flex-wrap gap-2">
                  {reflection.rolesInvolved.slice(0, 4).map((role) => (
                    <span
                      key={role}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
            <Link
              href={`/public/${reflection.id}`}
              className="mt-4 inline-flex items-center text-sm font-semibold text-slate-900 underline-offset-4 hover:underline"
            >
              Read More →
            </Link>
          </div>
        );
      })}
    </div>
  );
}

export default function LandingPage() {
  const { currentUser, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && currentUser) {
      router.replace("/dashboard");
    }
  }, [currentUser, loading, router]);

  const { reflections, loading: loadingReflections, error: reflectionsError } = usePublicReflections(
    !loading && !currentUser,
  );

  const benefits = [
    {
      icon: "📝",
      title: "Reflect Clearly",
      description: "Capture meaningful thoughts effortlessly.",
    },
    {
      icon: "🎭",
      title: "Role-Based Coaching",
      description: "AI gives targeted advice for each life role.",
    },
    {
      icon: "📅",
      title: "Weekly Insights",
      description: "Every 7 days, AI summarizes your patterns and progress.",
    },
  ];

  const features = [
    {
      title: "AI Suggestions",
      description: "Personalized 5–7 sentence guidance.",
    },
    {
      title: "Role Management",
      description: "Define your roles once, get ongoing clarity.",
    },
    {
      title: "Weekly Summary",
      description: "AI-generated weekly patterns and insights.",
    },
    {
      title: "Public Reflections",
      description: "Share anonymously or with your name.",
    },
    {
      title: "Like System",
      description: "Anyone can like your public reflections.",
    },
    {
      title: "Multi-Device Sync",
      description: "Your reflections are saved across all devices.",
    },
  ];

  const steps = [
    {
      title: "Write a Reflection",
      description: "Capture your thoughts naturally.",
    },
    {
      title: "Get AI Coaching",
      description: "Receive personalized insights tailored to your roles.",
    },
    {
      title: "Grow Weekly",
      description: "AI reviews your week and summarizes your progress.",
    },
  ];

  return (
    <main className="bg-white text-slate-900">
      <section className="px-6 py-20 sm:px-10">
        <div className="mx-auto max-w-6xl space-y-12">
          <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div className="space-y-8">
              <div className="space-y-5">
                <p className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">Revo Reflect</p>
                <h1 className="text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">
                  Revo Reflect
                  <br />
                  Grow in Every Role of Your Life.
                </h1>
                <p className="max-w-2xl text-lg leading-relaxed text-slate-600">
                  A calm space to reflect, gain clarity, and receive AI-powered coaching aligned with the roles you play.
                </p>
              </div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <Link
                  href="/signin"
                  className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                >
                  Start Reflecting →
                </Link>
                <Link
                  href="/public"
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50"
                >
                  Explore Public Reflections
                </Link>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-[#F8F9FB] p-6 shadow-sm">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-medium">Today</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">Balanced</span>
                </div>
                <div className="mt-4 space-y-3">
                  <p className="text-xs font-medium uppercase tracking-[0.15em] text-slate-500">Roles</p>
                  <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-800">
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">Leader</span>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">Parent</span>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">Friend</span>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-[#F8F9FB] p-4">
                    <p className="text-sm font-semibold text-slate-900">AI Coaching</p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                      You balanced empathy and clarity today. Continue setting gentle boundaries while giving others space to
                      voice their ideas.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-sm font-semibold text-slate-900">Reflection</p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                      Shared priorities with the team and asked for feedback before finalizing the plan. Felt calm and
                      intentional.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="text-2xl">{benefit.icon}</div>
                <h3 className="mt-3 text-lg font-semibold text-slate-900">{benefit.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#F8F9FB] px-6 py-16 sm:px-10">
        <div className="mx-auto max-w-6xl space-y-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">What you get</p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-900">Everything you need to reflect deeply</h2>
            </div>
            <div className="hidden text-sm text-slate-600 md:block">Ultra minimal, focused on clarity.</div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16 sm:px-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-8">
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">Public reflections</p>
            <h2 className="text-3xl font-semibold text-slate-900">Discover Reflections from the Community</h2>
            <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
              Explore how others grow in their roles. View their reflections, leave a like, and learn from real journeys.
            </p>
          </div>
          <ReflectionPreviewList
            reflections={reflections}
            loading={loadingReflections}
            error={reflectionsError}
          />
          <div>
            <Link
              href="/public"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50"
            >
              View All Public Reflections →
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 sm:px-10">
        <div className="mx-auto max-w-5xl space-y-10 text-center">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">How it works</p>
            <h2 className="text-3xl font-semibold text-slate-900">A calm rhythm for growth</h2>
            <p className="text-sm leading-relaxed text-slate-600">
              Three simple steps to keep you grounded and progressing every week.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="text-sm font-semibold uppercase tracking-[0.1em] text-slate-500">Step {index + 1}</div>
                <h3 className="mt-3 text-lg font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </main>
  );
}
