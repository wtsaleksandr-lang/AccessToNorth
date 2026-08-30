type TrailerIconType = "dry-van" | "reefer" | "curtain-side" | "flatbed" | "step-deck" | "lowboy" | "custom";

interface TrailerTypeIconProps {
  category?: string;
  name?: string;
  custom?: boolean;
  active?: boolean;
  className?: string;
}

const iconLabels: Record<TrailerIconType, string> = {
  "dry-van": "Dry van trailer",
  reefer: "Refrigerated trailer",
  "curtain-side": "Curtain-side trailer",
  flatbed: "Flatbed trailer",
  "step-deck": "Step-deck trailer",
  lowboy: "RGN lowboy trailer",
  custom: "Custom trailer",
};

function resolveIconType(category?: string, custom?: boolean): TrailerIconType {
  if (custom) return "custom";
  switch (category?.toLowerCase()) {
    case "reefer": return "reefer";
    case "curtain side": return "curtain-side";
    case "flatbed": return "flatbed";
    case "step deck": return "step-deck";
    case "rgn / lowboy": return "lowboy";
    default: return "dry-van";
  }
}

export function TrailerTypeIcon({ category, name, custom = false, active = false, className = "h-10 w-20" }: TrailerTypeIconProps) {
  const type = resolveIconType(category, custom);
  const stroke = active ? "#0369a1" : "#475569";
  const accent = active ? "#0ea5e9" : "#94a3b8";
  const pale = active ? "#e0f2fe" : "#f8fafc";
  const lengthLabel = name?.match(/\b(48|53)'/)?.[1];

  const cab = (
    <>
      <path d="M91 25h13l10 10v10H91V25Z" fill={pale} stroke={stroke} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M97 28h5l7 7H97v-7Z" fill="white" stroke={stroke} strokeWidth="1.2" />
      <circle cx="101" cy="46" r="4.5" fill="white" stroke={stroke} strokeWidth="2" />
    </>
  );

  return (
    <svg viewBox="0 0 120 58" className={className} role="img" aria-label={iconLabels[type]} fill="none">
      {type === "dry-van" && (
        <>
          <rect x="5" y="10" width="86" height="35" rx="1" fill={pale} stroke={stroke} strokeWidth="1.8" />
          <path d="M11 15v25M17 15v25M82 10v35M86 14v27" stroke={accent} strokeWidth="1" opacity=".65" />
          <circle cx="25" cy="46" r="4.5" fill="white" stroke={stroke} strokeWidth="2" />
          <circle cx="78" cy="46" r="4.5" fill="white" stroke={stroke} strokeWidth="2" />
        </>
      )}

      {type === "reefer" && (
        <>
          <rect x="5" y="9" width="86" height="36" rx="3" fill={pale} stroke={stroke} strokeWidth="1.8" />
          <rect x="75" y="13" width="12" height="27" rx="2" fill={active ? "#bae6fd" : "#e2e8f0"} stroke={stroke} strokeWidth="1.4" />
          <path d="M81 17v19M77 21l8 11M85 21l-8 11" stroke={accent} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M10 14h61M10 18h61" stroke={accent} strokeWidth="1" opacity=".5" />
          <circle cx="24" cy="46" r="4.5" fill="white" stroke={stroke} strokeWidth="2" />
          <circle cx="72" cy="46" r="4.5" fill="white" stroke={stroke} strokeWidth="2" />
        </>
      )}

      {type === "curtain-side" && (
        <>
          <rect x="5" y="11" width="86" height="34" rx="2" fill={pale} stroke={stroke} strokeWidth="1.8" />
          <path d="M12 14c5 5-3 9 2 14s-3 8 1 13M28 14c5 5-3 9 2 14s-3 8 1 13M44 14c5 5-3 9 2 14s-3 8 1 13M60 14c5 5-3 9 2 14s-3 8 1 13M76 14c5 5-3 9 2 14s-3 8 1 13" stroke={accent} strokeWidth="1.2" />
          <path d="M9 18h78M9 38h78" stroke={stroke} strokeWidth="1" opacity=".55" />
          <circle cx="25" cy="46" r="4.5" fill="white" stroke={stroke} strokeWidth="2" />
          <circle cx="78" cy="46" r="4.5" fill="white" stroke={stroke} strokeWidth="2" />
        </>
      )}

      {type === "flatbed" && (
        <>
          <path d="M5 36h86v7H5z" fill={active ? "#bae6fd" : "#e2e8f0"} stroke={stroke} strokeWidth="1.8" />
          <path d="M8 15v21M88 15v21" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
          <path d="M18 27h19v9H18zM48 21h24v15H48z" fill={pale} stroke={accent} strokeWidth="1.4" />
          <path d="M22 27v9M53 21v15" stroke={accent} strokeWidth="1" opacity=".6" />
          <circle cx="25" cy="46" r="4.5" fill="white" stroke={stroke} strokeWidth="2" />
          <circle cx="78" cy="46" r="4.5" fill="white" stroke={stroke} strokeWidth="2" />
        </>
      )}

      {type === "step-deck" && (
        <>
          <path d="M5 25h22v11h64v7H20V32H5z" fill={active ? "#bae6fd" : "#e2e8f0"} stroke={stroke} strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M9 14v11M87 18v18" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
          <rect x="42" y="22" width="27" height="14" rx="1" fill={pale} stroke={accent} strokeWidth="1.4" />
          <path d="M47 22v14M64 22v14" stroke={accent} strokeWidth="1" opacity=".6" />
          <circle cx="25" cy="46" r="4.5" fill="white" stroke={stroke} strokeWidth="2" />
          <circle cx="78" cy="46" r="4.5" fill="white" stroke={stroke} strokeWidth="2" />
        </>
      )}

      {type === "lowboy" && (
        <>
          <path d="M5 20h17v11l9 10h43l8-17h9v20H75l-4 3H29l-11-12H5z" fill={active ? "#bae6fd" : "#e2e8f0"} stroke={stroke} strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M37 27h30v14H37z" fill={pale} stroke={accent} strokeWidth="1.4" />
          <path d="M42 27v14M62 27v14" stroke={accent} strokeWidth="1" opacity=".6" />
          <circle cx="18" cy="46" r="4" fill="white" stroke={stroke} strokeWidth="1.8" />
          <circle cx="77" cy="47" r="4" fill="white" stroke={stroke} strokeWidth="1.8" />
          <circle cx="87" cy="47" r="4" fill="white" stroke={stroke} strokeWidth="1.8" />
        </>
      )}

      {type === "custom" && (
        <>
          <rect x="7" y="12" width="82" height="32" rx="3" fill={pale} stroke={stroke} strokeWidth="1.8" strokeDasharray="5 3" />
          <path d="M12 8h72M12 5v6M84 5v6M3 17v22M1 17h5M1 39h5" stroke={accent} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M45 21v14M38 28h14" stroke={accent} strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="24" cy="46" r="4.5" fill="white" stroke={stroke} strokeWidth="2" />
          <circle cx="77" cy="46" r="4.5" fill="white" stroke={stroke} strokeWidth="2" />
        </>
      )}

      {cab}
      {lengthLabel && type !== "flatbed" && type !== "step-deck" && type !== "lowboy" && (
        <g>
          <rect x="52" y="14" width="18" height="10" rx="5" fill={active ? "#0284c7" : "#64748b"} />
          <text x="61" y="21.5" textAnchor="middle" fill="white" fontSize="7" fontWeight="700">{lengthLabel}′</text>
        </g>
      )}
      {lengthLabel && (type === "flatbed" || type === "step-deck") && (
        <text x="13" y="32" fill={stroke} fontSize="7" fontWeight="700">{lengthLabel}′</text>
      )}
    </svg>
  );
}
