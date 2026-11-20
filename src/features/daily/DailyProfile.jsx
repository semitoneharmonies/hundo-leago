import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TEAM_PATTERN_GROUPS, isTeamPatternTemplate, teamPatternTemplate } from "../../shared/teamPatternCatalog.js";
import { dailyKey, dailyRead, dailyWrite } from "./dailyApi.js";
import { DailyUserStripes } from "./DailyUserStripes.jsx";
import "./DailyProfile.css";

const pickerColours = { primaryColour:"#784b74", secondaryColour:"#dce6f5", tertiaryColour:"#8acfb0" };

export function DailyProfile({ session }) {
  const client = useQueryClient();
  const result = useQuery(dailyRead(session,"/profile"));
  const [draft, setDraft] = useState(undefined);
  const [message, setMessage] = useState("");
  const saved = result.data?.profile?.appearance ?? null;
  const appearance = draft === undefined ? saved : draft;
  const selected = isTeamPatternTemplate(appearance?.patternTemplate) ? teamPatternTemplate(appearance.patternTemplate) : null;
  const dirty = JSON.stringify(appearance) !== JSON.stringify(saved);
  const command = useMutation({
    mutationFn: async next => {
      const data = await dailyWrite(session,"/profile",{appearance:next});
      if (!data?.profile || !Object.hasOwn(data.profile,"appearance")) throw new Error("Your saved stripes could not be confirmed. Try loading your profile again.");
      return data;
    },
    onSuccess: (data,next) => {
      client.setQueryData(dailyKey(session.user.id,"/profile"),data);
      void client.invalidateQueries({ queryKey:["daily",session.user.id], predicate:query=>query.queryKey[2] !== "/profile" });
      setDraft(undefined);
      setMessage(next === null ? "Stripes cleared." : "Stripes saved.");
    },
    onError: () => setMessage(""),
  });
  function edit(next) {
    setDraft(next);
    setMessage("");
    command.reset();
  }
  function chooseTemplate(value) {
    if (!value) return edit(null);
    const template = teamPatternTemplate(value);
    edit({ patternTemplate:value,
      primaryColour:appearance?.primaryColour || pickerColours.primaryColour,
      secondaryColour:appearance?.secondaryColour || pickerColours.secondaryColour,
      tertiaryColour:template.colourCount === 3 ? appearance?.tertiaryColour || pickerColours.tertiaryColour : null });
  }
  function save(next) {
    setMessage("");
    command.mutate(next);
  }
  return <section className="hdp-profile hds-skin" aria-labelledby="daily-profile-title">
    <header><h1 id="daily-profile-title">Your Daily stripes</h1>
      <p>Choose the stripes beside your name in Hundo Daily standings.</p></header>
    {result.isPending ? <p role="status">Loading your stripes…</p>
      : !result.data?.profile ? <p className="hdp-error" role="alert">{result.error?.message || "Your Daily profile is unavailable."}{" "}
        <button type="button" className="hds-button" onClick={()=>result.refetch()}>Try again</button></p>
      : <form aria-label="Daily stripe settings" onSubmit={event=>{event.preventDefault(); if (dirty && !command.isPending) save(appearance);}}>
        <div className="hdp-grid">
          <fieldset className="hdp-controls" disabled={command.isPending}>
            <legend className="hds-visually-hidden">Choose your stripes</legend>
            <label className="hdp-template">Stripe template
              <select value={selected?.id || ""} onChange={event=>chooseTemplate(event.target.value)}>
                <option value="">None</option>
                {TEAM_PATTERN_GROUPS.map(group=><optgroup key={group.label} label={group.label}>
                  {group.templates.map(template=><option key={template.id} value={template.id}>{template.name} · {template.colourCount} colours</option>)}
                </optgroup>)}
              </select>
            </label>
            {selected && <fieldset className="hdp-colours"><legend>Choose {selected.colourCount} colours</legend>
              {["primaryColour","secondaryColour",...(selected.colourCount === 3 ? ["tertiaryColour"] : [])].map((key,index)=><label key={key}>
                <span>Colour {index + 1}</span><input type="color" aria-label={"Colour " + (index + 1)} value={appearance[key]} onInput={event=>edit({...appearance,[key]:event.target.value})}/>
                <small>{appearance[key]}</small>
              </label>)}
            </fieldset>}
            <p className="hdp-note">Choose None to keep your standings row plain.</p>
          </fieldset>
          <section className="hdp-preview" aria-label="Stripe preview">
            <h2>Standings preview</h2>
            <table><thead><tr><th scope="col">Rank</th><th scope="col">Manager</th><th scope="col">Salary</th><th scope="col">Total FP</th></tr></thead>
              <tbody><tr><td>1</td><th scope="row" className="hd-user-stripe-cell"><DailyUserStripes appearance={appearance}/>{session.user.displayName}</th><td>$24</td><td className="hdp-preview-fp">19.25</td></tr></tbody>
            </table>
            <p>{selected ? selected.name : "No stripes selected."}</p>
            {dirty && <small>Unsaved preview</small>}
          </section>
        </div>
        {command.isError && <p className="hdp-error" role="alert">{command.error.message}</p>}
        {message && <p className="hdp-message" role="status">{message}</p>}
        <div className="hdp-actions">
          <button type="submit" className="hds-button hds-button-solid" disabled={!dirty || command.isPending}>{command.isPending && command.variables !== null ? "Saving…" : "Save stripes"}</button>
          <button type="button" className="hds-button" disabled={!dirty || command.isPending} onClick={()=>edit(undefined)}>Cancel changes</button>
          <button type="button" className="hds-button hdp-clear" disabled={saved === null || command.isPending} onClick={()=>save(null)}>{command.isPending && command.variables === null ? "Clearing…" : "Clear stripes"}</button>
        </div>
      </form>}
  </section>;
}
