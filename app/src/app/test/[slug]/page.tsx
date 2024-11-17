import styles from '../../page.module.css';

export default async function Index({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<JSX.Element> {
  const slug = (await params).slug;
  return (
    <main className={styles.main}>
      <a href="/">HOME</a>
      <h1>{slug}</h1>
    </main>
  );
}
