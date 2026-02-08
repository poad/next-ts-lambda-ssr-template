import { JSX } from 'react';
import styles from '../../page.module.css';
import Link from 'next/link';

export default async function Index({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<JSX.Element> {
  const slug = (await params).slug;
  return (
    <main className={styles.main}>
      <Link href="/">HOME</Link>
      <h1>{slug}</h1>
    </main>
  );
}
