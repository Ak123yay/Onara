"use client";

/* eslint-disable @next/next/no-img-element */

import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Globe,
  Image as ImageIcon,
  LoaderCircle,
  MapPin,
  Palette,
  Phone,
  Rocket,
  Search,
  Sparkles,
  Star,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, type CSSProperties, type ReactNode, useEffect, useRef, useState } from "react";

type PlacePhoto = {
  name: string;
  attribution?: {
    displayName?: string;
    uri?: string;
  };
};

type ManualPhotoUpload = {
  name: string;
  preview_url: string;
  size: number;
  type: string;
};

type PlaceSearchResult = {
  place_id: string;
  name: string;
  address: string | null;
  phone: string | null;
  rating: number | null;
  review_count: number | null;
  category: string | null;
  website: string | null;
  hours: string[] | null;
  photos: PlacePhoto[];
  confidence: number;
  manual_photo?: ManualPhotoUpload | null;
};

type PlacesSearchResponse = {
  results?: PlaceSearchResult[];
  error?: string;
  message?: string;
};

type GenerateApiResponse = {
  agent6Model?: string;
  agent6ModelReason?: string | null;
  agent6ModelRequested?: string | null;
  agent_6_model?: string;
  agent_6_model_reason?: string | null;
  agent_6_model_requested?: string | null;
  error?: string;
  jobId?: string;
  job_id?: string;
  message?: string;
  projectId?: string | null;
  project_id?: string | null;
  queuePosition?: number | null;
  queue_position?: number | null;
};

type BusinessSearchFlowProps = {
  initialQuery?: string | null;
  isTrial: boolean;
  userEmail: string;
  userName?: string | null;
  userPlan: UserPlan;
};

type UserPlan = "free" | "starter" | "pro";
type PaletteChoice = "emergency" | "trust" | "clean" | "custom";
type LayoutChoice = "phone-first" | "trust-led" | "service-grid" | "split-hero";
type ToneChoice = "direct" | "professional" | "friendly" | "premium";
type CtaChoice = "call-now" | "free-estimate" | "emergency" | "book-online";
type SectionChoice = "reviews" | "license" | "service-area" | "gallery" | "faq" | "financing";
type Agent6ModelChoice =
  | "onara-default"
  | "copilot-gemini-3.1-pro"
  | "copilot-gpt-5.4-mini"
  | "openai-gpt-5.5-high"
  | "claude-opus-4.8-high";

type CustomPalette = {
  accent: string;
  background: string;
  primary: string;
  text: string;
};

type StylePreferences = {
  cta: CtaChoice;
  customPalette: CustomPalette;
  layout: LayoutChoice;
  notes: string;
  palette: PaletteChoice;
  sections: SectionChoice[];
  tone: ToneChoice;
};

type GenerationPackage = {
  agent_6_model: Agent6ModelChoice;
  business: PlaceSearchResult;
  created_at: string;
  style: StylePreferences;
};

type Agent6ModelOption = {
  description: string;
  executable: boolean;
  id: Agent6ModelChoice;
  label: string;
  minimumPlan: UserPlan;
  model: string;
  provider: string;
  unavailableReason?: string;
};

const defaultStylePreferences: StylePreferences = {
  cta: "free-estimate",
  customPalette: {
    accent: "#ea5b0c",
    background: "#fff7ed",
    primary: "#10263a",
    text: "#ffffff",
  },
  layout: "phone-first",
  notes: "",
  palette: "emergency",
  sections: ["reviews", "license", "service-area"],
  tone: "professional",
};

const paletteOptions: Array<{
  description: string;
  id: PaletteChoice;
  label: string;
  swatches: string[];
}> = [
  {
    description: "Navy, orange, and high-contrast CTAs for urgent local service calls.",
    id: "emergency",
    label: "Emergency orange",
    swatches: ["#10263a", "#ea5b0c", "#fff7ed"],
  },
  {
    description: "Cream, blue-green, and proof-first accents for license and review trust.",
    id: "trust",
    label: "Trust blue",
    swatches: ["#f7efe2", "#006477", "#fff7ed"],
  },
  {
    description: "Clean charcoal, sand, and copper for maintenance and planned work.",
    id: "clean",
    label: "Clean local",
    swatches: ["#1a1a1a", "#c96f35", "#f4efe6"],
  },
  {
    description: "Use the custom colors you pick below.",
    id: "custom",
    label: "Custom",
    swatches: ["#10263a", "#ea5b0c", "#fff7ed"],
  },
];

const layoutOptions: Array<{
  description: string;
  id: LayoutChoice;
  label: string;
}> = [
  {
    description: "Big phone CTA, emergency strip, service cards, then trust proof.",
    id: "phone-first",
    label: "Phone-first",
  },
  {
    description: "License, reviews, and service area proof before the call action.",
    id: "trust-led",
    label: "Trust-led",
  },
  {
    description: "Clear service menu for HVAC, roofing, cleaning, and planned work.",
    id: "service-grid",
    label: "Service grid",
  },
  {
    description: "Large visual area beside services, proof, and the primary CTA.",
    id: "split-hero",
    label: "Split hero",
  },
];

const toneOptions: Array<{
  description: string;
  id: ToneChoice;
  label: string;
}> = [
  {
    description: "Short, practical, built for homeowners who need help now.",
    id: "direct",
    label: "Direct",
  },
  {
    description: "Polished contractor copy with proof, clarity, and no hype.",
    id: "professional",
    label: "Professional",
  },
  {
    description: "Warmer phrasing for family-owned and neighborhood businesses.",
    id: "friendly",
    label: "Friendly",
  },
  {
    description: "More refined copy for premium, high-ticket local services.",
    id: "premium",
    label: "Premium",
  },
];

const layoutSketches: Record<LayoutChoice, number[]> = {
  "phone-first": [70, 95, 92, 52],
  "trust-led": [54, 82, 100, 72],
  "service-grid": [88, 42, 42, 42, 42],
  "split-hero": [100, 56, 56, 76],
};

const toneExamples: Record<ToneChoice, string> = {
  direct: "\"Fast help. Clear pricing. Call now.\"",
  friendly: "\"Local, helpful, and easy to work with.\"",
  premium: "\"Refined service for serious home projects.\"",
  professional: "\"Proof-led copy without generic filler.\"",
};

const ctaOptions: Array<{
  description: string;
  id: CtaChoice;
  label: string;
}> = [
  {
    description: "Prioritize tap-to-call buttons and phone number visibility.",
    id: "call-now",
    label: "Call now",
  },
  {
    description: "Use estimate language for homeowners comparing providers.",
    id: "free-estimate",
    label: "Free estimate",
  },
  {
    description: "Push emergency availability and same-day service.",
    id: "emergency",
    label: "Emergency help",
  },
  {
    description: "Lead with appointment or booking language.",
    id: "book-online",
    label: "Book online",
  },
];

const sectionOptions: Array<{
  description: string;
  id: SectionChoice;
  label: string;
}> = [
  { description: "Show rating and review snippets near the top.", id: "reviews", label: "Google reviews" },
  { description: "Add license, insurance, and trust badge copy.", id: "license", label: "License proof" },
  { description: "Make the service area clear for local SEO.", id: "service-area", label: "Service area" },
  { description: "Feature the best business photos in a clean strip.", id: "gallery", label: "Photo gallery" },
  { description: "Answer common homeowner objections.", id: "faq", label: "FAQ block" },
  { description: "Mention financing or payment options if relevant.", id: "financing", label: "Financing" },
];

const planRank: Record<UserPlan, number> = {
  free: 0,
  starter: 1,
  pro: 2,
};

const agent6ModelOptions: Agent6ModelOption[] = [
  {
    description: "Current production-safe route: GLM 5.1, then Llama 4 Maverick, then local Gemma 4.",
    executable: true,
    id: "onara-default",
    label: "Onara default",
    minimumPlan: "free",
    model: "GLM 5.1 -> Maverick -> Gemma 4",
    provider: "NVIDIA NIM + local fallback",
  },
  {
    description: "Highest-quality Copilot route through the backend SDK, with Onara fallback if Copilot is unavailable.",
    executable: true,
    id: "copilot-gemini-3.1-pro",
    label: "Copilot Gemini 3.1 Pro",
    minimumPlan: "starter",
    model: "gemini-3.1-pro-preview",
    provider: "GitHub Copilot SDK",
  },
  {
    description: "Faster Copilot route through the backend SDK, with Onara fallback if Copilot is unavailable.",
    executable: true,
    id: "copilot-gpt-5.4-mini",
    label: "Copilot GPT 5.4 Mini",
    minimumPlan: "starter",
    model: "gpt-5.4-mini",
    provider: "GitHub Copilot SDK",
  },
  {
    description: "Reserved for Pro users after user key storage and provider clients exist.",
    executable: false,
    id: "openai-gpt-5.5-high",
    label: "OpenAI GPT-5.5 High",
    minimumPlan: "pro",
    model: "gpt-5.5-high",
    provider: "User OpenAI key",
    unavailableReason: "OpenAI user-key storage and client are not wired yet.",
  },
  {
    description: "Reserved for Pro users after user key storage and provider clients exist.",
    executable: false,
    id: "claude-opus-4.8-high",
    label: "Claude Opus 4.8 High",
    minimumPlan: "pro",
    model: "claude-opus-4.8-high",
    provider: "User Anthropic key",
    unavailableReason: "Anthropic user-key storage and client are not wired yet.",
  },
];

export function BusinessSearchFlow({ initialQuery, isTrial, userEmail, userName, userPlan }: BusinessSearchFlowProps) {
  const normalizedInitialQuery = initialQuery?.trim().slice(0, 200) ?? "";
  const initialSearchStarted = useRef(false);
  const [query, setQuery] = useState(normalizedInitialQuery);
  const [results, setResults] = useState<PlaceSearchResult[] | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<PlaceSearchResult | null>(null);
  const [confirmedBusiness, setConfirmedBusiness] = useState<PlaceSearchResult | null>(null);
  const [stylePreferences, setStylePreferences] =
    useState<StylePreferences>(defaultStylePreferences);
  const [generationPackage, setGenerationPackage] = useState<GenerationPackage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const effectivePlan: UserPlan = isTrial ? "pro" : userPlan;

  useEffect(() => {
    if (!normalizedInitialQuery || initialSearchStarted.current) {
      return;
    }

    initialSearchStarted.current = true;
    void runSearch(normalizedInitialQuery);
  }, [normalizedInitialQuery]);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formQuery = new FormData(event.currentTarget).get("query");
    const trimmedQuery = (typeof formQuery === "string" ? formQuery : query).trim();
    if (trimmedQuery.length < 2) {
      setError("Type at least 2 characters to search Google.");
      return;
    }

    await runSearch(trimmedQuery);
  }

  async function runSearch(trimmedQuery: string) {
    setQuery(trimmedQuery);
    setIsSearching(true);
    setError(null);
    setResults(null);
    setSelectedBusiness(null);
    setConfirmedBusiness(null);
    setGenerationPackage(null);

    try {
      const response = await fetch("/api/places/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: trimmedQuery }),
      });
      const payload = (await response.json()) as PlacesSearchResponse;

      if (!response.ok) {
        throw new Error(payload.message ?? payload.error ?? "Google Places search failed.");
      }

      setResults(payload.results ?? []);
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : "Google Places search failed.");
    } finally {
      setIsSearching(false);
    }
  }

  const displayName = userName?.trim() || userEmail.split("@")[0] || "Account";
  const displayInitial = displayName.charAt(0).toUpperCase();
  const firstName = displayName.split(" ")[0] || "there";
  const currentStep = generationPackage ? 3 : confirmedBusiness ? 2 : selectedBusiness ? 1 : 0;

  return (
    <main className="build-shell paper">
      <section className="build-header">
        <Link href="/" className="onara-logo">
          <span className="onara-logo-mark" aria-hidden="true">
            <span className="onara-logo-dot" />
          </span>
          <span>Onara</span>
        </Link>
        <div className="build-user-pill" title={userEmail}>
          <span className="build-user-initial">{displayInitial}</span>
          <span>{displayName}</span>
        </div>
      </section>

      <section className="build-workspace">
        <StepIndicator current={currentStep} />

        {!selectedBusiness ? (
          <div className="build-panel fadein-up">
            <p className="eyebrow">Step 1 - Find your business</p>
            <h1 className="serif">
              Where are you on <span className="serif-italic">Google</span>, {firstName}?
            </h1>
            <p className="build-subcopy">
              Search the Google Business Profile we should use for your address, phone, hours,
              category, reviews, and photos.
            </p>

            <form className="places-search-form" onSubmit={handleSearch}>
              <Search size={18} aria-hidden="true" />
              <input
                name="query"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="e.g. Mike's Plumbing Arlington VA"
                aria-label="Business name and city"
              />
              <button className="btn btn-accent" type="submit" disabled={isSearching}>
                {isSearching ? (
                  <>
                    <LoaderCircle className="spin" size={16} aria-hidden="true" />
                    Searching
                  </>
                ) : (
                  <>
                    Search Google
                    <ArrowRight size={14} aria-hidden="true" />
                  </>
                )}
              </button>
            </form>

            {error ? <p className="places-error">{error}</p> : null}

            {results ? (
              <div className="places-results">
                <p className="mono">{results.length} matches found</p>
                {results.length > 0 ? (
                  <div className="places-result-list">
                    {results.map((result) => (
                      <button
                        key={result.place_id || result.name}
                        className="place-result-card hover-lift"
                        type="button"
                        onClick={() => setSelectedBusiness(result)}
                      >
                        <BusinessMonogram name={result.name} />
                        <span className="place-result-main">
                          <span className="place-result-title-row">
                            <span className="serif">{result.name || "Unnamed business"}</span>
                            {result.rating ? (
                              <span className="place-rating">
                                <Star size={12} fill="currentColor" aria-hidden="true" />
                                {result.rating}
                                {result.review_count ? ` - ${result.review_count}` : ""}
                              </span>
                            ) : null}
                            {result.category ? <span className="badge">{result.category}</span> : null}
                          </span>
                          <span className="place-result-detail">
                            <MapPin size={12} aria-hidden="true" />
                            {result.address ?? "Address not listed"}
                          </span>
                          <span className="place-result-meta">
                            <span>
                              <Phone size={11} aria-hidden="true" />
                              {result.phone ?? "No phone on file"}
                            </span>
                            <span>
                              <Clock size={11} aria-hidden="true" />
                              {summarizeHours(result.hours)}
                            </span>
                          </span>
                        </span>
                        <ArrowRight size={16} aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="places-empty card">
                    <p className="serif">No matches came back.</p>
                    <span>
                      Try the exact Google business name with city and state, or include the phone
                      number shown on Google Maps.
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="build-hint">
                <span className="hand">try a real Google Business Profile</span>
              </div>
            )}
          </div>
        ) : (
          <>
            {!confirmedBusiness ? (
              <BusinessConfirmationCard
                business={selectedBusiness}
                confirmed={false}
                onBack={() => {
                  setSelectedBusiness(null);
                  setConfirmedBusiness(null);
                  setGenerationPackage(null);
                }}
                onConfirm={(business) => {
                  setSelectedBusiness(business);
                  setConfirmedBusiness(business);
                  setGenerationPackage(null);
                }}
              />
            ) : !generationPackage ? (
              <StylePreferenceStep
                business={confirmedBusiness}
                preferences={stylePreferences}
                onBack={() => {
                  setConfirmedBusiness(null);
                  setGenerationPackage(null);
                }}
                onChange={(nextPreferences) => {
                  setStylePreferences(nextPreferences);
                  setGenerationPackage(null);
                }}
                onContinue={() => {
                  setGenerationPackage({
                    agent_6_model: defaultAgent6ModelForPlan(effectivePlan),
                    business: confirmedBusiness,
                    created_at: new Date().toISOString(),
                    style: stylePreferences,
                  });
                }}
              />
            ) : (
              <GenerateStep
                effectivePlan={effectivePlan}
                generationPackage={generationPackage}
                isTrial={isTrial}
                onBack={() => setGenerationPackage(null)}
              />
            )}
          </>
        )}
      </section>
    </main>
  );
}

function StepIndicator({ current }: { current: number }) {
  const steps = ["Find", "Confirm", "Style", "Generate"];

  return (
    <div className="step-indicator" aria-label="Build progress">
      {steps.map((step, index) => (
        <div className="step-indicator-item" key={step}>
          <span
            className={[
              "step-dot",
              index < current ? "step-dot-done" : "",
              index === current ? "step-dot-active" : "",
            ].join(" ")}
          >
            {index < current ? <Check size={12} aria-hidden="true" /> : index + 1}
          </span>
          <span className={index === current ? "step-label-active" : ""}>{step}</span>
        </div>
      ))}
    </div>
  );
}

function StylePreferenceStep({
  business,
  preferences,
  onBack,
  onChange,
  onContinue,
}: {
  business: PlaceSearchResult;
  preferences: StylePreferences;
  onBack: () => void;
  onChange: (preferences: StylePreferences) => void;
  onContinue: () => void;
}) {
  function updatePreference<Key extends keyof StylePreferences>(
    key: Key,
    value: StylePreferences[Key],
  ) {
    onChange({ ...preferences, [key]: value });
  }

  function selectPalette(option: (typeof paletteOptions)[number]) {
    if (option.id === "custom") {
      onChange({
        ...preferences,
        palette: "custom",
      });
      return;
    }

    const [primary, accent, background] = option.swatches;

    onChange({
      ...preferences,
      customPalette: {
        accent,
        background,
        primary,
        text: textColorForPalette(option.id),
      },
      palette: option.id,
    });
  }

  function updateCustomPalette(key: keyof CustomPalette, value: string) {
    onChange({
      ...preferences,
      customPalette: {
        ...preferences.customPalette,
        [key]: value,
      },
      palette: "custom",
    });
  }

  function toggleSection(section: SectionChoice) {
    const exists = preferences.sections.includes(section);
    const nextSections = exists
      ? preferences.sections.filter((item) => item !== section)
      : [...preferences.sections, section];

    updatePreference("sections", nextSections);
  }

  return (
    <div className="style-wrap style-wrap-simple fadein-up">
      <div className="style-heading">
        <p className="eyebrow">Step 3 - Style</p>
        <h1 className="serif">
          Choose the first <span className="serif-italic">direction</span>.
        </h1>
        <p>
          These choices guide the generated contractor website. They can be changed later with revisions.
        </p>
      </div>

      <div className="style-layout style-builder-grid">
        <div className="style-controls style-control-stack">
          <section className="style-simple-card style-palette-builder">
            <p className="mono">
              <Palette size={15} aria-hidden="true" />
              Palette
            </p>
            <div className="palette-preset-row">
              {paletteOptions.map((option) => {
                  const active = preferences.palette === option.id;
                  const swatches =
                    option.id === "custom"
                      ? [
                          preferences.customPalette.primary,
                          preferences.customPalette.accent,
                          preferences.customPalette.background,
                          preferences.customPalette.text,
                        ]
                      : option.swatches;

                  return (
                    <button
                      aria-pressed={active}
                      className={`palette-preset ${active ? "palette-preset-active" : ""}`}
                      key={option.id}
                      onClick={() => selectPalette(option)}
                      type="button"
                    >
                      <span className="palette-swatch-row" aria-hidden="true">
                        {swatches.map((swatch, index) => (
                          <span key={`${swatch}-${index}`} style={{ background: swatch }} />
                        ))}
                      </span>
                      <span className="palette-preset-copy">
                        <strong>{option.label}</strong>
                        <small>{option.description}</small>
                      </span>
                    </button>
                  );
                })}
            </div>

            {preferences.palette === "custom" ? (
              <div className="custom-palette-box">
                <div>
                  <strong>Pick your own palette</strong>
                  <span>Use your brand colors or just choose what looks right.</span>
                </div>
                <div className="custom-color-grid">
                  <CustomColorInput
                    label="Primary"
                    value={preferences.customPalette.primary}
                    onChange={(value) => updateCustomPalette("primary", value)}
                  />
                  <CustomColorInput
                    label="Accent"
                    value={preferences.customPalette.accent}
                    onChange={(value) => updateCustomPalette("accent", value)}
                  />
                  <CustomColorInput
                    label="Background"
                    value={preferences.customPalette.background}
                    onChange={(value) => updateCustomPalette("background", value)}
                  />
                  <CustomColorInput
                    label="Text"
                    value={preferences.customPalette.text}
                    onChange={(value) => updateCustomPalette("text", value)}
                  />
                </div>
              </div>
            ) : null}
          </section>

          <LayoutPreferenceGroup
            selected={preferences.layout}
            onSelect={(layout) => updatePreference("layout", layout)}
          />

          <TonePreferenceGroup
            selected={preferences.tone}
            onSelect={(tone) => updatePreference("tone", tone)}
          />

          <StyleOptionGroup
            label="Conversion goal"
            icon={<Rocket size={15} aria-hidden="true" />}
            options={ctaOptions}
            selected={preferences.cta}
            onSelect={(cta) => updatePreference("cta", cta)}
          />

          <section className="style-simple-card style-sections-card">
            <p className="mono">
              <Check size={15} aria-hidden="true" />
              Include on page
            </p>
            <div className="style-section-toggle-grid">
              {sectionOptions.map((section) => {
                const active = preferences.sections.includes(section.id);

                return (
                  <button
                    aria-pressed={active}
                    className={`style-section-toggle ${active ? "style-section-toggle-active" : ""}`}
                    key={section.id}
                    onClick={() => toggleSection(section.id)}
                    type="button"
                  >
                    <span>{section.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="style-simple-card style-notes-card">
            <p className="mono">
              <Sparkles size={15} aria-hidden="true" />
              Notes
            </p>
            <textarea
              className="input style-notes-input"
              maxLength={700}
              onChange={(event) => updatePreference("notes", event.target.value)}
              placeholder="Anything else? Example: use our navy/gold colors, highlight emergency repairs, mention family-owned since 1998, avoid stock-photo language."
              rows={5}
              value={preferences.notes}
            />
            <small>{preferences.notes.length}/700 characters</small>
          </section>
        </div>

        <div className="style-preview-column">
          <StylePreview business={business} preferences={preferences} />

          <div className="style-preview-actions">
            <button className="btn btn-soft" type="button" onClick={onBack}>
              <ArrowLeft size={14} aria-hidden="true" />
              Back
            </button>
            <button className="btn btn-accent" type="button" onClick={onContinue}>
              Continue
              <ArrowRight size={14} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LayoutPreferenceGroup({
  onSelect,
  selected,
}: {
  onSelect: (layout: LayoutChoice) => void;
  selected: LayoutChoice;
}) {
  return (
    <section className="style-option-group style-layout-choices">
      <p className="mono">
        <Globe size={15} aria-hidden="true" />
        Layout
      </p>
      <div className="layout-choice-grid">
        {layoutOptions.map((option) => {
          const active = option.id === selected;

          return (
            <button
              aria-pressed={active}
              className={`layout-choice-card ${active ? "layout-choice-card-active" : ""}`}
              key={option.id}
              onClick={() => onSelect(option.id)}
              type="button"
            >
              <span className="layout-choice-sketch" aria-hidden="true">
                {layoutSketches[option.id].map((width, index) => (
                  <span key={`${option.id}-${index}`} style={{ width: `${width}%` }} />
                ))}
              </span>
              <strong>{option.label}</strong>
              <small>{option.description}</small>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function TonePreferenceGroup({
  onSelect,
  selected,
}: {
  onSelect: (tone: ToneChoice) => void;
  selected: ToneChoice;
}) {
  return (
    <section className="style-option-group style-tone-choices">
      <p className="mono">
        <Sparkles size={15} aria-hidden="true" />
        Tone
      </p>
      <div className="tone-choice-grid">
        {toneOptions.map((option) => {
          const active = option.id === selected;

          return (
            <button
              aria-pressed={active}
              className={`tone-choice-card ${active ? "tone-choice-card-active" : ""}`}
              key={option.id}
              onClick={() => onSelect(option.id)}
              type="button"
            >
              <strong>{option.label}</strong>
              <small>{toneExamples[option.id]}</small>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function CustomColorInput({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="custom-color-input">
      <span>{label}</span>
      <input
        aria-label={`${label} color`}
        onChange={(event) => onChange(event.target.value)}
        type="color"
        value={value}
      />
      <input
        aria-label={`${label} hex value`}
        defaultValue={value}
        key={value}
        maxLength={7}
        onBlur={(event) => {
          const nextValue = normalizeHexInput(event.target.value, value);
          event.currentTarget.value = nextValue;
          onChange(nextValue);
        }}
      />
    </label>
  );
}

function StyleOptionGroup<Value extends string>({
  icon,
  label,
  onSelect,
  options,
  selected,
}: {
  icon: ReactNode;
  label: string;
  onSelect: (value: Value) => void;
  options: Array<{
    description: string;
    id: Value;
    label: string;
    swatches?: string[];
  }>;
  selected: Value;
}) {
  return (
    <section className="style-option-group">
      <p className="mono">
        {icon}
        {label}
      </p>
      <div className="style-option-list">
        {options.map((option) => {
          const active = option.id === selected;

          return (
            <button
              aria-pressed={active}
              className={`style-option ${active ? "style-option-active" : ""}`}
              key={option.id}
              onClick={() => onSelect(option.id)}
              type="button"
            >
              <span>
                <strong>{option.label}</strong>
                <small>{option.description}</small>
              </span>
              {option.swatches ? (
                <span className="style-swatches" aria-hidden="true">
                  {option.swatches.map((swatch) => (
                    <span key={swatch} style={{ background: swatch }} />
                  ))}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function StylePreview({
  business,
  preferences,
}: {
  business: PlaceSearchResult;
  preferences: StylePreferences;
}) {
  const palette = paletteOptions.find((option) => option.id === preferences.palette) ?? paletteOptions[0];
  const layout = layoutOptions.find((option) => option.id === preferences.layout) ?? layoutOptions[0];
  const tone = toneOptions.find((option) => option.id === preferences.tone) ?? toneOptions[1];
  const cta = ctaOptions.find((option) => option.id === preferences.cta) ?? ctaOptions[1];
  const selectedSections = sectionOptions.filter((option) => preferences.sections.includes(option.id));
  const colors = activePaletteColors(preferences);
  const previewStyle = {
    "--style-accent": colors.accent,
    "--style-background": colors.background,
    "--style-primary": colors.primary,
    "--style-text": colors.text,
  } as CSSProperties;

  return (
    <aside className={`style-preview style-preview-${preferences.palette}`} style={previewStyle}>
      <div className="style-preview-window">
        <div className="style-preview-bar">
          <span />
          <span />
          <span />
          <strong>{slugForBusiness(business.name)}.onara.site</strong>
        </div>
        <div className="style-preview-alert">
          <span>{business.category ?? "Local contractor"}</span>
          <strong>{cta.label}</strong>
        </div>
        <div className={`style-preview-hero style-preview-hero-${preferences.layout}`}>
          <p className="mono">{layout.label}</p>
          <h2 className="serif">{headlineForLayout(business.name, preferences.layout)}</h2>
          <span>{copyForTone(preferences.tone)}</span>
          <button className="style-preview-cta" type="button">
            {cta.label}
          </button>
        </div>
        <div className="style-preview-services">
          {(selectedSections.length > 0 ? selectedSections : sectionOptions.slice(0, 3)).map((section) => (
            <span key={section.id}>{section.label}</span>
          ))}
        </div>
      </div>

      <div className="style-preview-summary">
        <p className="eyebrow">Selected direction</p>
        <strong>{palette.label}</strong>
        <span className="style-summary-swatches" aria-label="Selected palette colors">
          <span style={{ background: colors.primary }} />
          <span style={{ background: colors.accent }} />
          <span style={{ background: colors.background }} />
          <span style={{ background: colors.text }} />
        </span>
        <span>
          {layout.label} layout, {tone.label.toLowerCase()} tone, {cta.label.toLowerCase()} CTA.
        </span>
        {preferences.notes.trim() ? (
          <em>{preferences.notes.trim().slice(0, 110)}{preferences.notes.trim().length > 110 ? "..." : ""}</em>
        ) : null}
      </div>
    </aside>
  );
}

function GenerateStep({
  effectivePlan,
  generationPackage,
  isTrial,
  onBack,
}: {
  effectivePlan: UserPlan;
  generationPackage: GenerationPackage;
  isTrial: boolean;
  onBack: () => void;
}) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [prepared, setPrepared] = useState(false);
  const [agent6Model, setAgent6Model] = useState<Agent6ModelChoice>(
    generationPackage.agent_6_model,
  );
  const palette = paletteOptions.find((option) => option.id === generationPackage.style.palette);
  const layout = layoutOptions.find((option) => option.id === generationPackage.style.layout);
  const tone = toneOptions.find((option) => option.id === generationPackage.style.tone);
  const cta = ctaOptions.find((option) => option.id === generationPackage.style.cta);
  const colors = activePaletteColors(generationPackage.style);
  const selectedSections = sectionOptions
    .filter((option) => generationPackage.style.sections.includes(option.id))
    .map((option) => option.label)
    .join(", ");

  async function prepareGenerationPackage() {
    if (isStarting || prepared) {
      return;
    }

    setErrorMessage(null);
    setIsStarting(true);

    try {
      const selectedGenerationPackage = {
        ...generationPackage,
        agent_6_model: agent6Model,
      };
      const response = await fetch("/api/pipeline/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agent_6_model: agent6Model,
          business_data: selectedGenerationPackage.business,
          generation_package: selectedGenerationPackage,
          style_preferences: selectedGenerationPackage.style,
        }),
      });
      const payload = (await response.json()) as GenerateApiResponse;

      if (!response.ok) {
        setErrorMessage(payload.message ?? "The pipeline could not start. Check FastAPI and try again.");
        return;
      }

      const jobId = payload.jobId ?? payload.job_id;
      if (!jobId) {
        setErrorMessage("The pipeline started without returning a job id.");
        return;
      }
      const projectId = payload.projectId ?? payload.project_id ?? null;

      const savedPackage = {
        ...selectedGenerationPackage,
        agent_6_model: (payload.agent6Model ?? payload.agent_6_model ?? agent6Model) as Agent6ModelChoice,
        agent_6_model_reason: payload.agent6ModelReason ?? payload.agent_6_model_reason ?? null,
        agent_6_model_requested: payload.agent6ModelRequested ?? payload.agent_6_model_requested ?? agent6Model,
      };

      window.sessionStorage.setItem(`onara:generation:${jobId}`, JSON.stringify(savedPackage));
      window.sessionStorage.setItem("onara:last-generation-package", JSON.stringify(savedPackage));
      window.localStorage.setItem(`onara:generation:${jobId}`, JSON.stringify(savedPackage));
      window.localStorage.setItem("onara:last-generation-package", JSON.stringify(savedPackage));
      if (projectId) {
        window.localStorage.setItem(`onara:generation:project:${projectId}`, JSON.stringify(savedPackage));
      }
      setPrepared(true);
      const projectParam = projectId ? `&projectId=${encodeURIComponent(projectId)}` : "";
      router.push(`/dashboard/build/progress?jobId=${encodeURIComponent(jobId)}${projectParam}`);
    } catch {
      setErrorMessage("The pipeline server is unreachable. Confirm FastAPI and the tunnel are running.");
    } finally {
      setIsStarting(false);
    }
  }

  return (
    <div className="generate-wrap fadein-up">
      <div className="style-heading">
        <p className="eyebrow">Step 4 - Generate</p>
        <h1 className="serif">
          Ready for the <span className="serif-italic">agent build</span>.
        </h1>
        <p>
          Phase 14 streams a live build console and preview now. Phase 15 swaps this mock stream to
          the real FastAPI generation server.
        </p>
      </div>

      <section className="generate-card card">
        <div className="generate-summary">
          <BusinessMonogram name={generationPackage.business.name} />
          <div>
            <p className="mono">Generation package</p>
            <h2 className="serif">{generationPackage.business.name}</h2>
            <span>{generationPackage.business.address ?? "Service area pending"}</span>
          </div>
        </div>

        <div className="generate-grid">
          <GenerateFact label="Palette" value={palette?.label ?? generationPackage.style.palette} />
          <GenerateFact
            label="Colors"
            value={`${colors.primary} / ${colors.accent} / ${colors.background} / ${colors.text}`}
          />
          <GenerateFact label="Layout" value={layout?.label ?? generationPackage.style.layout} />
          <GenerateFact label="Tone" value={tone?.label ?? generationPackage.style.tone} />
          <GenerateFact label="CTA" value={cta?.label ?? generationPackage.style.cta} />
          <GenerateFact label="Sections" value={selectedSections || "Smart defaults"} />
          <GenerateFact
            label="Notes"
            value={generationPackage.style.notes.trim() || "No extra notes"}
          />
          <GenerateFact
            label="Google data"
            value={`${generationPackage.business.rating ?? "No rating"} rating, ${
              generationPackage.business.photos.length || generationPackage.business.manual_photo ? "photo ready" : "no photo"
            }`}
          />
        </div>

        <Agent6ModelSelector
          effectivePlan={effectivePlan}
          isTrial={isTrial}
          onChange={setAgent6Model}
          selected={agent6Model}
        />

        <div className={`generate-status ${prepared ? "generate-status-ready" : ""}`}>
          <Rocket size={16} aria-hidden="true" />
          <span>
            {isStarting
              ? "Starting the FastAPI pipeline and reserving a queue slot."
              : prepared
              ? "Starting the live build console with this saved package."
              : "This will start the agent progress console and live preview for this build."}
          </span>
        </div>

        {errorMessage ? <p className="auth-message">{errorMessage}</p> : null}
      </section>

      <div className="confirmation-actions">
        <button className="btn btn-soft" type="button" onClick={onBack}>
          <ArrowLeft size={14} aria-hidden="true" />
          Back to style
        </button>
        <button
          className="btn btn-accent"
          disabled={isStarting || prepared}
          type="button"
          onClick={prepareGenerationPackage}
        >
          {isStarting || prepared ? "Starting..." : "Start agent build"}
          <Rocket size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function Agent6ModelSelector({
  effectivePlan,
  isTrial,
  onChange,
  selected,
}: {
  effectivePlan: UserPlan;
  isTrial: boolean;
  onChange: (model: Agent6ModelChoice) => void;
  selected: Agent6ModelChoice;
}) {
  const planLabel = isTrial ? "Pro trial" : `${effectivePlan.charAt(0).toUpperCase()}${effectivePlan.slice(1)} plan`;

  return (
    <section className="agent6-selector" aria-labelledby="agent6-selector-title">
      <div className="agent6-selector-head">
        <div>
          <p className="mono">Agent 6 model</p>
          <h3 id="agent6-selector-title" className="serif">
            Choose the code generator route.
          </h3>
        </div>
        <span>{planLabel}</span>
      </div>

      <div className="agent6-option-list">
        {agent6ModelOptions.map((option) => {
          const allowed = planAllows(effectivePlan, option.minimumPlan);
          const enabled = allowed && option.executable;
          const active = selected === option.id;
          const reason = agent6OptionReason(option, allowed);

          return (
            <button
              aria-pressed={active}
              className={[
                "agent6-option",
                active ? "agent6-option-active" : "",
                enabled ? "" : "agent6-option-disabled",
              ].join(" ")}
              disabled={!enabled}
              key={option.id}
              onClick={() => onChange(option.id)}
              type="button"
            >
              <span className="agent6-option-main">
                <span>
                  <strong>{option.label}</strong>
                  <small>{option.description}</small>
                </span>
                <span className="agent6-option-model">{option.model}</span>
              </span>
              <span className="agent6-option-meta">
                <span>{option.provider}</span>
                <span>{enabled ? "Ready" : reason}</span>
              </span>
            </button>
          );
        })}
      </div>

      <p className="agent6-selector-note">
        Server-side validation still decides the final route. If a locked or unavailable model is sent,
        FastAPI falls back to Onara default instead of failing the build.
      </p>
    </section>
  );
}

function GenerateFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="generate-fact">
      <p className="mono">{label}</p>
      <strong>{value}</strong>
    </div>
  );
}

function BusinessConfirmationCard({
  business,
  confirmed,
  onBack,
  onConfirm,
}: {
  business: PlaceSearchResult;
  confirmed: boolean;
  onBack: () => void;
  onConfirm: (business: PlaceSearchResult) => void;
}) {
  const [draft, setDraft] = useState(() => ({
    address: business.address ?? "",
    phone: business.phone ?? "",
    hours: business.hours?.join("\n") ?? "",
    photo: business.manual_photo ?? null,
  }));
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);
  const correctedBusiness = applyManualFallbacks(business, draft);
  const primaryPhoto = correctedBusiness.photos[0];
  const manualPhoto = correctedBusiness.manual_photo;
  const attribution = primaryPhoto?.attribution;
  const photoSrc = primaryPhoto ? placePhotoUrl(primaryPhoto.name) : manualPhoto?.preview_url;
  const missingCount = [
    !correctedBusiness.address,
    !correctedBusiness.phone,
    !correctedBusiness.hours?.length,
    !primaryPhoto && !manualPhoto,
  ].filter(Boolean).length;
  const manualUpdateCount = [
    !business.address && Boolean(correctedBusiness.address),
    !business.phone && Boolean(correctedBusiness.phone),
    !business.hours?.length && Boolean(correctedBusiness.hours?.length),
    !business.photos.length && Boolean(manualPhoto),
  ].filter(Boolean).length;

  function updateDraft<Key extends keyof typeof draft>(key: Key, value: (typeof draft)[Key]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function handlePhotoUpload(file: File | null) {
    setPhotoUploadError(null);

    if (!file) {
      updateDraft("photo", null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setPhotoUploadError("Choose an image file.");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setPhotoUploadError("Choose an image under 8 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setPhotoUploadError("Could not read that image. Try another file.");
        return;
      }

      updateDraft("photo", {
        name: file.name,
        preview_url: reader.result,
        size: file.size,
        type: file.type,
      });
    };
    reader.onerror = () => setPhotoUploadError("Could not read that image. Try another file.");
    reader.readAsDataURL(file);
  }

  return (
    <div className="confirmation-wrap fadein-up">
      <div className="confirmation-heading">
        <p className="eyebrow">Step 2 - Confirm</p>
        <h1 className="serif">
          Is this <span className="serif-italic">you</span>?
        </h1>
      </div>

      <article className="confirmation-card card">
        <div className="confirmation-photo">
          {photoSrc ? (
            <>
              <img
                src={photoSrc}
                alt={`Business photo for ${correctedBusiness.name}`}
              />
              <span className="photo-source">
                {primaryPhoto ? "From Google Business Profile" : "Uploaded photo"}
              </span>
              {attribution?.displayName ? (
                <a
                  className="photo-attribution"
                  href={normalizeAttributionUrl(attribution.uri)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Photo by {attribution.displayName}
                </a>
              ) : null}
            </>
          ) : (
            <div className="photo-placeholder">
              <ImageIcon size={28} aria-hidden="true" />
              <span>No Google photo returned yet. Upload one below.</span>
            </div>
          )}
        </div>

        <div className="confirmation-body">
          <div className="confirmation-title-row">
            <BusinessMonogram name={correctedBusiness.name} />
            <div>
              <p className="mono">Imported from Google Business Profile</p>
              <h2 className="serif">{correctedBusiness.name || "Unnamed business"}</h2>
              {correctedBusiness.category ? (
                <p className="confirmation-category">{correctedBusiness.category}</p>
              ) : null}
            </div>
            {correctedBusiness.rating ? (
              <div className="confirmation-rating" aria-label={`${correctedBusiness.rating} star rating`}>
                <strong>{correctedBusiness.rating}</strong>
                <span>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      size={11}
                      fill={index < Math.round(correctedBusiness.rating ?? 0) ? "currentColor" : "none"}
                      aria-hidden="true"
                    />
                  ))}
                </span>
                <small>{correctedBusiness.review_count ?? 0} reviews</small>
              </div>
            ) : null}
          </div>

          <div className="confirmation-fields">
            <ConfirmField
              icon={<MapPin size={13} aria-hidden="true" />}
              label="Address"
              value={correctedBusiness.address}
              fallback="Address missing"
              manualValue={draft.address}
              manualPlaceholder="123 Main St, Arlington, VA"
              manualLabel="Add business address"
              editable={business.address === null}
              onManualChange={(value) => updateDraft("address", value)}
            />
            <ConfirmField
              icon={<Phone size={13} aria-hidden="true" />}
              label="Phone"
              value={correctedBusiness.phone}
              fallback="Phone missing"
              manualValue={draft.phone}
              manualPlaceholder="(703) 555-0123"
              manualLabel="Add phone number"
              editable={business.phone === null}
              onManualChange={(value) => updateDraft("phone", value)}
            />
            <ConfirmField
              icon={<Clock size={13} aria-hidden="true" />}
              label="Hours"
              value={correctedBusiness.hours?.join("\n")}
              fallback="Hours missing"
              manualValue={draft.hours}
              manualPlaceholder={"Mon-Fri: 8 AM-5 PM\nSat: 9 AM-1 PM\nSun: Closed"}
              manualLabel="Add hours"
              editable={!business.hours?.length}
              multiline
              onManualChange={(value) => updateDraft("hours", value)}
            />
            <ConfirmField
              icon={<ImageIcon size={13} aria-hidden="true" />}
              label="Photos"
              value={
                correctedBusiness.photos.length > 0
                  ? `${correctedBusiness.photos.length} Google photo${
                      correctedBusiness.photos.length === 1 ? "" : "s"
                    } found`
                  : manualPhoto
                    ? `Uploaded ${manualPhoto.name}`
                  : null
              }
              fallback="Photo missing"
            />
            {business.photos.length === 0 ? (
              <PhotoUploadField
                photo={draft.photo}
                error={photoUploadError}
                onUpload={handlePhotoUpload}
                onRemove={() => updateDraft("photo", null)}
              />
            ) : null}
            {correctedBusiness.website ? (
              <ConfirmField
                icon={<Globe size={13} aria-hidden="true" />}
                label="Website"
                value={correctedBusiness.website}
                fallback="Website missing"
              />
            ) : null}
          </div>

          <div className={`confirmation-note ${missingCount > 0 ? "confirmation-note-warning" : ""}`}>
            <Sparkles size={15} aria-hidden="true" />
            <span>
              {missingCount > 0
                ? "Add the highlighted missing details before continuing. Anything you enter manually is used for this confirmed business."
                : "Onara will use this confirmed business data as the starting point."}
            </span>
          </div>
        </div>
      </article>

      {confirmed ? (
        <div className="confirmation-success card">
          <Check size={16} aria-hidden="true" />
          <span>
            Business confirmed for this session
            {manualUpdateCount > 0 ? ` with ${manualUpdateCount} manual update${manualUpdateCount === 1 ? "" : "s"}` : ""}.
            Style preferences are the next build step.
          </span>
        </div>
      ) : null}

      <div className="confirmation-actions">
        <button className="btn btn-soft" type="button" onClick={onBack}>
          <ArrowLeft size={14} aria-hidden="true" />
          Search again
        </button>
        <button className="btn btn-accent" type="button" onClick={() => onConfirm(correctedBusiness)}>
          Looks right
          <ArrowRight size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function ConfirmField({
  icon,
  label,
  value,
  fallback,
  editable = false,
  manualValue,
  manualPlaceholder,
  manualLabel,
  onManualChange,
  multiline = false,
}: {
  icon: ReactNode;
  label: string;
  value: string | null | undefined;
  fallback: string;
  editable?: boolean;
  manualValue?: string;
  manualPlaceholder?: string;
  manualLabel?: string;
  onManualChange?: (value: string) => void;
  multiline?: boolean;
}) {
  const missing = !value;
  const InputElement = multiline ? "textarea" : "input";

  return (
    <div className={`confirm-field ${missing ? "confirm-field-missing" : ""}`}>
      <p className="mono">
        {icon}
        {label}
        {missing ? <span className="badge badge-warn">Missing</span> : null}
        {!missing && editable ? <span className="badge badge-manual">Manual</span> : null}
      </p>
      {editable && onManualChange ? (
        <>
          <label className="sr-only" htmlFor={`manual-${label.toLowerCase()}`}>
            {manualLabel ?? `Add ${label.toLowerCase()}`}
          </label>
          <InputElement
            id={`manual-${label.toLowerCase()}`}
            className="confirm-manual-control"
            value={manualValue ?? ""}
            onChange={(event) => onManualChange(event.target.value)}
            placeholder={manualPlaceholder ?? fallback}
            rows={multiline ? 3 : undefined}
          />
          <small className="confirm-manual-help">
            {missing ? "Google did not return this. Enter it manually." : "Manual value will be used."}
          </small>
        </>
      ) : (
        <span className={`confirm-field-value ${multiline ? "confirm-field-multiline" : ""}`}>
          {value ?? fallback}
        </span>
      )}
    </div>
  );
}

type ManualDraft = {
  address: string;
  phone: string;
  hours: string;
  photo: ManualPhotoUpload | null;
};

function applyManualFallbacks(business: PlaceSearchResult, draft: ManualDraft): PlaceSearchResult {
  const manualHours = draft.hours
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return {
    ...business,
    address: business.address ?? emptyToNull(draft.address),
    phone: business.phone ?? emptyToNull(draft.phone),
    hours: business.hours?.length ? business.hours : manualHours.length > 0 ? manualHours : null,
    manual_photo: business.photos.length === 0 ? draft.photo : null,
  };
}

function emptyToNull(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function BusinessMonogram({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return <span className="business-monogram">{initials || "O"}</span>;
}

function summarizeHours(hours: string[] | null) {
  if (!hours?.length) {
    return "Hours not listed";
  }

  return hours[0].replace("Monday: ", "Mon ");
}

function activePaletteColors(preferences: StylePreferences): CustomPalette {
  if (preferences.palette === "custom") {
    return preferences.customPalette;
  }

  const option = paletteOptions.find((palette) => palette.id === preferences.palette);

  if (!option) {
    return preferences.customPalette;
  }

  const [primary, accent, background] = option.swatches;

  return {
    accent,
    background,
    primary,
    text: textColorForPalette(option.id),
  };
}

function textColorForPalette(palette: PaletteChoice) {
  return palette === "trust" ? "#10263a" : "#ffffff";
}

function defaultAgent6ModelForPlan(_plan: UserPlan): Agent6ModelChoice {
  return "onara-default";
}

function planAllows(userPlan: UserPlan, minimumPlan: UserPlan) {
  return planRank[userPlan] >= planRank[minimumPlan];
}

function agent6OptionReason(option: Agent6ModelOption, allowed: boolean) {
  if (!allowed) {
    return `Requires ${option.minimumPlan}`;
  }

  return option.unavailableReason ?? "Not available yet";
}

function normalizeHexInput(rawValue: string, fallback: string) {
  const trimmed = rawValue.trim();
  const value = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;

  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback;
}

function slugForBusiness(name: string) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 28);

  return slug || "contractor";
}

function headlineForLayout(name: string, layout: LayoutChoice) {
  if (layout === "trust-led") {
    return `${name} homeowners can verify before they call.`;
  }

  if (layout === "service-grid") {
    return `Clear service options from ${name}.`;
  }

  if (layout === "split-hero") {
    return `${name} makes local service feel simple.`;
  }

  return `Fast local help from ${name}.`;
}

function copyForTone(tone: ToneChoice) {
  if (tone === "direct") {
    return "Tell customers what you do, where you serve, and how to call.";
  }

  if (tone === "friendly") {
    return "Helpful, local copy that sounds like a real neighborhood business.";
  }

  if (tone === "premium") {
    return "More polished language for higher-trust, higher-ticket work.";
  }

  return "Professional, proof-led copy without generic website filler.";
}

function placePhotoUrl(name: string) {
  return `/api/places/photo?name=${encodeURIComponent(name)}&w=1000&h=560`;
}

function normalizeAttributionUrl(uri?: string) {
  if (!uri) {
    return "https://maps.google.com";
  }

  return uri.startsWith("//") ? `https:${uri}` : uri;
}

function PhotoUploadField({
  photo,
  error,
  onUpload,
  onRemove,
}: {
  photo: ManualPhotoUpload | null;
  error: string | null;
  onUpload: (file: File | null) => void;
  onRemove: () => void;
}) {
  return (
    <div className={`confirm-field confirm-photo-upload ${photo ? "" : "confirm-field-missing"}`}>
      <p className="mono">
        <Upload size={13} aria-hidden="true" />
        Upload Photo
        {photo ? <span className="badge badge-manual">Uploaded</span> : <span className="badge badge-warn">Missing</span>}
      </p>
      <label className="photo-upload-dropzone">
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={(event) => onUpload(event.target.files?.[0] ?? null)}
        />
        <span className="photo-upload-icon">
          <Upload size={16} aria-hidden="true" />
        </span>
        <span>
          <strong>{photo ? photo.name : "Choose an image"}</strong>
          <small>PNG, JPG, WebP, or GIF. Max 8 MB.</small>
        </span>
      </label>
      {photo ? (
        <button className="photo-upload-remove" type="button" onClick={onRemove}>
          <X size={12} aria-hidden="true" />
          Remove photo
        </button>
      ) : null}
      {error ? <small className="confirm-manual-error">{error}</small> : null}
    </div>
  );
}
