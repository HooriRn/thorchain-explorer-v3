'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import LostIcon from '@/assets/images/404.svg'
import ErrorIcon from '@/assets/images/500.svg'
import styles from './ErrorLayout.module.css'

interface ErrorLayoutProps {
  error?: {
    statusCode?: number
  }
}

const ErrorLayout: React.FC<ErrorLayoutProps> = ({ error }) => {
  const is404 = error?.statusCode === 404

  return (
    <div className={styles.errorContainer}>
      <div className={styles.error404}>
        {is404 ? (
          <Image src={LostIcon} alt="404 Not Found" width={272} height={272} />
        ) : (
          <Image src={ErrorIcon} alt="500 Error" width={272} height={272} />
        )}
      </div>
      <div className={styles.errorMessage}>
        <h2>{is404 ? 'Page Not Found' : 'Something Went Wrong'}</h2>
        <p>
          {is404
            ? "Sorry, the page you're looking for does not exist or has been moved."
            : 'An unusual behavior happened, please let the devs know!'}
        </p>
        <Link href="/" className={styles.backHome}>
          Go back Home
        </Link>
      </div>
    </div>
  )
}

export default ErrorLayout 