"use client";

import { useState } from "react";
import {
  Avatar,
  AvatarGroup,
  AvatarState,
  Breadcrumb,
  Button,
  ButtonType,
  Checkbox,
  ColorMode,
  DatePicker,
  Divider,
  Dropdown,
  InputText,
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
  type KitTheme,
} from "@brandrail/kit";
import { Box, BoxHeader, Label, Select, cn } from "@brandrail/ui";

function Cell({ name, children, wide }: { name: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={cn("flex flex-col gap-3 border-b border-line p-4 md:border-r", wide && "md:col-span-2")}>
      <code className="font-mono text-xs text-fg-muted">{`<${name}>`}</code>
      <div className="flex min-h-12 flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

export function KitGallery() {
  const [theme, setTheme] = useState<KitTheme>("brandrail");
  const [mode, setMode] = useState<ColorMode>(ColorMode.LIGHT);
  const [toggle, setToggle] = useState(true);
  const [checked, setChecked] = useState(true);
  const [selected, setSelected] = useState(0);
  const [date, setDate] = useState<Date | null>(null);
  const [name, setName] = useState("");
  const p = { theme, colorMode: mode };
  const dark = mode === ColorMode.DARK;

  return (
    <Box>
      <BoxHeader className="flex-wrap justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-fg">Live library</h2>
          <Label tone="done">@brandrail/kit</Label>
          <span className="text-xs text-fg-muted">Midrocks UI kit · 28 components</span>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="kit-theme" className="text-xs text-fg-muted">Theme</label>
          <Select id="kit-theme" value={theme} onChange={(e) => setTheme(e.target.value as KitTheme)} className="h-7 w-36 text-xs">
            {KIT_THEMES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
          <Select aria-label="Colour mode" value={mode} onChange={(e) => setMode(e.target.value as ColorMode)} className="h-7 w-24 text-xs">
            <option value={ColorMode.LIGHT}>light</option>
            <option value={ColorMode.DARK}>dark</option>
          </Select>
        </div>
      </BoxHeader>

      <div
        className={cn("grid overflow-hidden rounded-b-md md:grid-cols-2 xl:grid-cols-3", theme, mode)}
        style={{ background: dark ? (theme === "brandrail" ? "#0d1117" : "#141414") : "#ffffff", colorScheme: dark ? "dark" : "light" }}
      >
        <Cell name="Button">
          <div className="w-28"><Button {...p} label="Save" size={Size.SMALL} /></div>
          <div className="w-28"><Button {...p} label="Cancel" type={ButtonType.GHOST} size={Size.SMALL} /></div>
          <div className="w-28"><Button {...p} label="Delete" type={ButtonType.DANGER} size={Size.SMALL} /></div>
        </Cell>
        <Cell name="InputText">
          <div className="w-full">
            <InputText {...p} label="Truck ID" placeholder="HT-204" value={name} onChange={(e) => setName(e.target.value)} size={Size.SMALL} />
          </div>
        </Cell>
        <Cell name="Dropdown">
          <div className="w-full">
            <Dropdown {...p} selected={selected} onChange={setSelected} size={Size.SMALL}>
              <ListItem {...p} label="Brake inspection" value="brake" />
              <ListItem {...p} label="Tyre rotation" value="tyre" />
              <ListItem {...p} label="Engine service" value="engine" />
            </Dropdown>
          </div>
        </Cell>
        <Cell name="Toggle / Checkbox / Radio">
          <Toggle {...p} label="Alerts" checked={toggle} onChange={setToggle} size={Size.SMALL} />
          <Checkbox {...p} label="Approved" checked={checked} onChange={(e) => setChecked(e.target.checked)} size={Size.SMALL} />
          <RadioGroup {...p} size={Size.SMALL}>
            <Radio {...p} name="shift" value="day" label="Day" checked />
            <Radio {...p} name="shift" value="night" label="Night" />
          </RadioGroup>
        </Cell>
        <Cell name="Notification" wide>
          <div className="w-full">
            <Notification {...p} type={NotificationType.SUCCESS} title="Brand Kit published" message="v1.5.0 is live in every AI tool." size={Size.SMALL} />
          </div>
        </Cell>
        <Cell name="ProgressBar">
          <div className="w-full"><ProgressBar {...p} value={82} size={Size.SMALL} /></div>
        </Cell>
        <Cell name="Avatar / AvatarGroup">
          <Avatar {...p} initials="TB" state={AvatarState.ONLINE} size={Size.MEDIUM} />
          <AvatarGroup {...p} maxDisplay={3} avatars={[{ initials: "JO" }, { initials: "PR" }, { initials: "SA" }, { initials: "MK" }, { initials: "LT" }]} />
        </Cell>
        <Cell name="DatePicker">
          <div className="w-full"><DatePicker {...p} selectedDate={date} onChange={setDate} placeholder="Next service" size={Size.SMALL} /></div>
        </Cell>
        <Cell name="Breadcrumb">
          <Breadcrumb {...p} size={Size.SMALL} items={[{ label: "Fleet", href: "#" }, { label: "Haul trucks", href: "#" }, { label: "HT-204", isCurrent: true }]} />
        </Cell>
        <Cell name="Tooltip / Loader">
          <Tooltip {...p} content="Score from the last scan" position={TooltipPosition.TOP_CENTER}>
            <span className={cn("cursor-help text-sm underline decoration-dotted", dark ? "text-white" : "text-black")}>Hover me</span>
          </Tooltip>
          <Loader {...p} />
        </Cell>
        <Cell name="Divider" wide>
          <div className="w-full"><Divider {...p} label="or" /></div>
        </Cell>
      </div>
    </Box>
  );
}
