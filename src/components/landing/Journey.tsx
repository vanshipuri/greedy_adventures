import { journeySteps } from "@/lib/landing/packages";

export function Journey() {
  return (
    <section id="plan" className="section journey-section" aria-labelledby="plan-title">
      <div className="shell">
        <div className="section-heading section-heading--center">
          <div>
            <span className="eyebrow">The plan</span>
            <h2 id="plan-title">Five steps from check-in to coastline.</h2>
          </div>
          <p>Budget three to four hours at the dropzone. The published page describes every step before the canopy landing.</p>
        </div>
        <ol className="journey-grid">
          {journeySteps.map((step) => (
            <li key={step.number} className="journey-step">
              <span className="journey-step__number">{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
        <div className="journey-band">
          <div>
            <span>Where you jump</span>
            <strong>Pattaya Sea View, Thailand</strong>
          </div>
          <div>
            <span>Operated by</span>
            <strong>Dropzone Thailand</strong>
          </div>
          <div>
            <span>Requirement</span>
            <strong>Bring your photo ID</strong>
          </div>
        </div>
      </div>
    </section>
  );
}
