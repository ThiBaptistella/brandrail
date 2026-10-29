"use client";

import { useId, useMemo, useState } from "react";
import {
  Avatar,
  AvatarGroup,
  AvatarState,
  Breadcrumb,
  Button,
  ButtonGroup,
  ButtonType,
  Checkbox,
  CheckboxGroup,
  ColorMode,
  DatePicker,
  Divider,
  Dropdown,
  InputText,
  InputTextArea,
  KIT_THEMES,
  ListItem,
  Loader,
  Notification,
  NotificationType,
  ProgressBar,
  Radio,
  RadioGroup,
  Size,
  Toggle,
  Tooltip,
  TooltipPosition,
  VideoPlayer,
  type KitTheme,
} from "@brandrail/kit";
import { Box, BoxHeader, Label, Select, cn } from "@brandrail/ui";
import type { BrandKitState } from "@/lib/brand-kit";
import { pickRoles } from "@/lib/brand-kit";
import { kitBridgeCss } from "@/lib/kit-bridge";

type P = { theme: string; colorMode: ColorMode };
type Demo = { wide?: boolean; render: (p: P, s: DemoState) => React.ReactNode };
type DemoState = ReturnType<typeof useDemoState>;

function useDemoState() {
  const [toggle, setToggle] = useState(true);
  const [checked, setChecked] = useState(true);
  const [selected, setSelected] = useState(0);
  const [date, setDate] = useState<Date | null>(null);
  const [text, setText] = useState("");
  const [shift, setShift] = useState("Day");
  return { toggle, setToggle, checked, setChecked, selected, setSelected, date, setDate, text, setText, shift, setShift };
}

/** One live example per kit component, keyed by registry name. */
const DEMOS: Record<string, Demo> = {
  Button: {
    render: (p) => (
      <>
        <div className="w-24"><Button {...p} label="Save" size={Size.SMALL} /></div>
        <div className="w-24"><Button {...p} label="Cancel" type={ButtonType.GHOST} size={Size.SMALL} /></div>
        <div className="w-24"><Button {...p} label="Delete" type={ButtonType.DANGER} size={Size.SMALL} /></div>
      </>
    ),
  },
  ButtonGroup: {
    render: (p) => (
      <ButtonGroup {...p} size={Size.SMALL}>
        <Button {...p} label="Day" type={ButtonType.GHOST} />
        <Button {...p} label="Week" type={ButtonType.GHOST} />
        <Button {...p} label="Month" type={ButtonType.GHOST} />
      </ButtonGroup>
    ),
  },
  InputText: {
    render: (p, s) => (
      <div className="w-full">
        <InputText {...p} label="Truck ID" placeholder="HT-204" value={s.text} onChange={(e) => s.setText(e.target.value)} size={Size.SMALL} />
      </div>
    ),
  },
  InputTextArea: {
    render: (p) => (
      <div className="w-full">
        <InputTextArea {...p} label="Notes for workshop" placeholder="Add a note…" size={Size.SMALL} />
      </div>
    ),
  },
  Dropdown: {
    render: (p, s) => (
      <div className="w-full">
        <Dropdown {...p} selected={s.selected} onChange={s.setSelected} size={Size.SMALL}>
          <ListItem {...p} label="Brake inspection" value="brake" />
          <ListItem {...p} label="Tyre rotation" value="tyre" />
          <ListItem {...p} label="Engine service" value="engine" />
        </Dropdown>
      </div>
    ),
  },
  Checkbox: { render: (p, s) => <Checkbox {...p} label="Approved" checked={s.checked} onChange={(e) => s.setChecked(e.target.checked)} size={Size.SMALL} /> },
  CheckboxGroup: {
    render: (p) => (
      <CheckboxGroup {...p} title="Checks" size={Size.SMALL}>
        <Checkbox {...p} label="Brakes" />
        <Checkbox {...p} label="Tyres" />
      </CheckboxGroup>
    ),
  },
  Radio: {
    render: (p, s) => (
      <RadioGroup {...p} size={Size.SMALL} onChange={s.setShift}>
        <Radio {...p} name="shift-a" value="Day" label="Day" checked={s.shift === "Day"} />
        <Radio {...p} name="shift-a" value="Night" label="Night" checked={s.shift === "Night"} />
      </RadioGroup>
    ),
  },
  RadioGroup: {
    render: (p, s) => (
      <RadioGroup {...p} title="Shift" size={Size.SMALL} onChange={s.setShift}>
        <Radio {...p} name="shift-b" value="Day" label="Day" checked={s.shift === "Day"} />
        <Radio {...p} name="shift-b" value="Night" label="Night" checked={s.shift === "Night"} />
      </RadioGroup>
    ),
  },
  Toggle: { render: (p, s) => <Toggle {...p} label="Alerts" checked={s.toggle} onChange={s.setToggle} size={Size.SMALL} /> },
  DatePicker: {
    render: (p, s) => (
      <div className="w-full">
        <DatePicker {...p} selectedDate={s.date} onChange={s.setDate} placeholder="Next service" size={Size.SMALL} />
      </div>
    ),
  },
  Notification: {
    wide: true,
    render: (p) => (
      <div className="w-full">
        <Notification {...p} type={NotificationType.SUCCESS} title="Brand Kit published" message="The new version is live in every AI tool." size={Size.SMALL} />
      </div>
    ),
  },
  ProgressBar: { render: (p) => <div className="w-full"><ProgressBar {...p} value={82} size={Size.SMALL} /></div> },
  Avatar: { render: (p) => <Avatar {...p} initials="TB" state={AvatarState.ONLINE} size={Size.MEDIUM} /> },
  AvatarGroup: { render: (p) => <AvatarGroup {...p} maxDisplay={3} avatars={[{ initials: "JO" }, { initials: "PR" }, { initials: "SA" }, { initials: "MK" }]} /> },
  Breadcrumb: { render: (p) => <Breadcrumb {...p} size={Size.SMALL} items={[{ label: "Fleet", href: "#" }, { label: "Haul trucks", href: "#" }, { label: "HT-204", isCurrent: true }]} /> },
  Tooltip: {
    render: (p) => (
      <Tooltip {...p} content="Score from the last scan" position={TooltipPosition.TOP_CENTER}>
        <span className="cursor-help text-sm underline decoration-dotted" style={{ color: "var(--textDarkPrimary)" }}>Hover me</span>
      </Tooltip>
    ),
  },
  Loader: { render: (p) => <Loader {...p} /> },
  Divider: { wide: true, render: (p) => <div className="w-full"><Divider {...p} label="or" /></div> },
  VideoPlayer: {
    wide: true,
    render: (p) => (
      <div className="w-full max-w-md">
        <VideoPlayer {...p} src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" />
      </div>
    ),
  },
};

export const KIT_COMPONENTS = Object.keys(DEMOS);

export type GalleryComponent = { name: string; importPath: string; status?: string };

function Cell({ name, note, wide, children }: { name: string; note?: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-3 p-4", wide && "md:col-span-2")} style={{ borderBottom: "1px solid var(--baseBorder)", borderRight: "1px solid var(--baseBorder)" }}>
      <div className="flex items-center gap-2">
        <code className="font-mono text-xs" style={{ color: "var(--textDarkSecondary)" }}>{`<${name}>`}</code>
        {note && <span className="text-[11px]" style={{ color: "var(--textDarkTertiary)" }}>{note}</span>}
      </div>
      <div className="flex min-h-12 flex-wrap items-center gap-3 justify-center">{children}</div>
    </div>
  );
}

/**
 * The live library: real kit components styled by the Brand Kit.
 * - `components`: the org's registry. Kit components in it are shown; others get a placeholder. Empty → the full default kit.
 * - `brandKit`: the Brand Kit to apply (published on the Components page, the draft in the Brand Kit editor).
 */
export function KitGallery({
  brandKit,
  brandKitLabel,
  components = [],
  embedded = false,
}: {
  brandKit: BrandKitState | null;
  brandKitLabel?: string;
  components?: GalleryComponent[];
  embedded?: boolean;
}) {
  const scopeId = `kit-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const [source, setSource] = useState<"brand-kit" | KitTheme>(brandKit ? "brand-kit" : "brandrail");
  const [mode, setMode] = useState<ColorMode>(ColorMode.LIGHT);
  const state = useDemoState();
  const dark = mode === ColorMode.DARK;
  const useBridge = source === "brand-kit" && !!brandKit;
  const p: P = { theme: useBridge ? "brandrail" : source, colorMode: mode };

  const css = useMemo(() => (useBridge && brandKit ? kitBridgeCss(brandKit, scopeId) : ""), [useBridge, brandKit, scopeId]);
  const canvas = useBridge && brandKit ? pickRoles(brandKit.colors, dark).canvas.value : dark ? "#0d1117" : "#ffffff";

  const fromRegistry = components.filter((c) => c.status !== "deprecated");
  const list: Array<{ name: string; demo?: Demo; importPath?: string }> = fromRegistry.length
    ? fromRegistry.map((c) => ({ name: c.name, demo: c.importPath === "@brandrail/kit" ? DEMOS[c.name] : undefined, importPath: c.importPath }))
    : KIT_COMPONENTS.map((name) => ({ name, demo: DEMOS[name] }));

  return (
    <Box className={embedded ? "border-0 shadow-none" : undefined}>
      <BoxHeader className="flex-wrap justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-[13px] font-medium text-fg">Live library</h2>
          <Label tone="done">@brandrail/kit</Label>
          <span className="text-xs text-fg-muted">
            {fromRegistry.length ? `${fromRegistry.length} components from your registry` : `Default kit · ${KIT_COMPONENTS.length} components`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Select aria-label="Styling" value={source} onChange={(e) => setSource(e.target.value as typeof source)} className="h-7 w-48 text-xs">
            {brandKit && <option value="brand-kit">{brandKitLabel ?? "Brand Kit"}</option>}
            {KIT_THEMES.map((t) => (
              <option key={t} value={t}>Kit theme: {t}</option>
            ))}
          </Select>
          <Select aria-label="Colour mode" value={mode} onChange={(e) => setMode(e.target.value as ColorMode)} className="h-7 w-24 text-xs">
            <option value={ColorMode.LIGHT}>light</option>
            <option value={ColorMode.DARK}>dark</option>
          </Select>
        </div>
      </BoxHeader>
      {css && <style>{css}</style>}
      <div
        id={scopeId}
        className={cn("grid overflow-hidden rounded-b-md md:grid-cols-2", !embedded && "xl:grid-cols-3", p.theme, mode)}
        style={{ background: canvas, colorScheme: dark ? "dark" : "light", fontFamily: "var(--fontA-fontFamily)" }}
      >
        {list.map(({ name, demo, importPath }) =>
          demo ? (
            <Cell key={name} name={name} wide={demo.wide}>
              {demo.render(p, state)}
            </Cell>
          ) : (
            <Cell key={name} name={name} note={importPath}>
              <span className="text-xs" style={{ color: "var(--textDarkTertiary)" }}>
                No live preview: it isn&apos;t part of the kit. AI tools still get its import, rules and example.
              </span>
            </Cell>
          ),
        )}
      </div>
    </Box>
  );
}
