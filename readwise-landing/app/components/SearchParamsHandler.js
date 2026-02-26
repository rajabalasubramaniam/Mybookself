// app/components/SearchParamsHandler.js
'use client'
import { Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

// Inner component that uses the hook
function SearchParamsHandlerContent() {
  const searchParams = useSearchParams()
  
  useEffect(() => {
    if (searchParams?.get('ref')) {
      console.log('Referral:', searchParams.get('ref'))
    }
  }, [searchParams])
  
  return null
}

// Outer component with Suspense boundary
export default function SearchParamsHandler() {
  return (
    <Suspense fallback={null}>
      <SearchParamsHandlerContent />
    </Suspense>
  )
}