import styles from "./Logo.module.css";

export function Logo({ fontSize = 19 }) {
  return (
    <span className={styles.logo}>
      <span className={styles.bars} aria-hidden="true">
        <span className={styles.bar} style={{ width: 8 }} />
        <span className={styles.bar} style={{ width: 14 }} />
        <span className={styles.bar} style={{ width: 20 }} />
      </span>
      <span className={styles.word} style={{ fontSize }}>
        listen
      </span>
    </span>
  );
}
