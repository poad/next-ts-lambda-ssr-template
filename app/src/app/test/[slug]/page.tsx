import styles from '../../page.module.css';

export default function Index({
  params: { slug },
}: {
  params: { slug: string };
}): JSX.Element {
  return (
    <main className={styles.main}>
      <a href="/">HOME</a>
      <h1>{slug}</h1>
    </main>
  );
}
