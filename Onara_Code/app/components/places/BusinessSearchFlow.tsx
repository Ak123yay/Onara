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
  Phone,
  Search,
  Sparkles,
  Star,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, type ReactNode, useState } from "react";

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

type BusinessSearchFlowProps = {
  userEmail: string;
  userName?: string | null;
};

export function BusinessSearchFlow({ userEmail, userName }: BusinessSearchFlowProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceSearchResult[] | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<PlaceSearchResult | null>(null);
  const [confirmedBusiness, setConfirmedBusiness] = useState<PlaceSearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 2) {
      setError("Type at least 2 characters to search Google.");
      return;
    }

    setIsSearching(true);
    setError(null);
    setResults(null);
    setSelectedBusiness(null);
    setConfirmedBusiness(null);

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

  return (
    <main className="build-shell paper">
      <section className="build-header">
        <Link href="/" className="onara-logo">
          <span className="onara-logo-mark" />
          <span>Onara</span>
        </Link>
        <div className="build-user-pill" title={userEmail}>
          <span className="build-user-initial">{displayInitial}</span>
          <span>{displayName}</span>
        </div>
      </section>

      <section className="build-workspace">
        <StepIndicator current={selectedBusiness ? 1 : 0} />

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
                      Try adding your city, state, or a nearby landmark. Manual Place ID fallback is
                      the next Phase 8 task.
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
          <BusinessConfirmationCard
            business={selectedBusiness}
            confirmed={confirmedBusiness?.place_id === selectedBusiness.place_id}
            onBack={() => {
              setSelectedBusiness(null);
              setConfirmedBusiness(null);
            }}
            onConfirm={(business) => {
              setSelectedBusiness(business);
              setConfirmedBusiness(business);
            }}
          />
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
