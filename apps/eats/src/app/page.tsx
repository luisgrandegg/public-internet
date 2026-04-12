import { Input, Button, Card } from '@public-internet/design-system'
import styles from './page.module.css'

export default function HomePage() {
  return (
    <>
      {/* Section 1 — Search hero */}
      <section className={styles.hero}>
        <h1 className={styles.heroHeading}>Food delivery without the extraction</h1>
        <p className={styles.heroSubheading}>
          A flat infrastructure fee is the only charge — transparent and published.
          No commission. No surge pricing. No hidden fees.
        </p>
        <form action="/restaurants" method="GET" className={styles.searchForm}>
          <div className={styles.searchField}>
            <Input
              name="city"
              label="Where are you?"
              placeholder="City or neighbourhood…"
            />
          </div>
          <Button type="submit" variant="primary">
            Find restaurants
          </Button>
        </form>
      </section>

      {/* Section 2 — How it works */}
      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>How it works</h2>
        <div className={styles.howItWorksGrid}>
          <Card variant="bordered" className={styles.step}>
            <div className={styles.stepNumber}>1</div>
            <h3 className={styles.stepTitle}>Browse restaurants</h3>
            <p className={styles.stepDescription}>
              Discover local restaurants in your area. Every price on the menu is the real
              price — no service charges added at checkout.
            </p>
          </Card>
          <Card variant="bordered" className={styles.step}>
            <div className={styles.stepNumber}>2</div>
            <h3 className={styles.stepTitle}>Place your order</h3>
            <p className={styles.stepDescription}>
              Before you confirm, you see the complete cost: items + flat infrastructure fee.
              No surprises. You only pay what is shown.
            </p>
          </Card>
          <Card variant="bordered" className={styles.step}>
            <div className={styles.stepNumber}>3</div>
            <h3 className={styles.stepTitle}>A courier picks it up</h3>
            <p className={styles.stepDescription}>
              Couriers are workers with rights — transparent pay, no arbitrary deactivation,
              and a cooperative model wherever the law permits.
            </p>
          </Card>
        </div>
      </section>

      {/* Section 3 — For restaurants */}
      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>For restaurants</h2>
        <p className={styles.sectionBody}>
          Onboarding is free. The platform charges restaurants nothing — no commission,
          no exclusivity requirement, no advertising tiers. A flat per-order infrastructure
          fee covers actual operating costs and is published for everyone to see.
        </p>
        <div className={styles.ctaRow}>
          <a href="/restaurant/register" className={styles.ctaPrimary}>
            Register your restaurant
          </a>
        </div>
      </section>

      {/* Section 4 — For couriers */}
      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>For couriers</h2>
        <p className={styles.sectionBody}>
          Your pay is calculated transparently: a flat base per delivery plus a distance
          rate — both shown before you accept. You can see the full calculation for every
          delivery in your history. If a decision affects your account, you have a clear
          appeal path.
        </p>
        <div className={styles.ctaRow}>
          <a href="/courier/register" className={styles.ctaSecondary}>
            Deliver with Eats
          </a>
        </div>
      </section>
    </>
  )
}
