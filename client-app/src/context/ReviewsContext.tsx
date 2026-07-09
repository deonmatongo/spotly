import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { reviews as seedReviews, Review } from '../data/mock'
import { getApiUrl } from '@spotly/shared'
import { useAuth } from './AuthContext'

interface ReviewsContextType {
  userReviews: Review[]
  allReviews: Review[]
  addReview: (input: { listingId: number; rating: number; text: string }) => Review
  reviewsFor: (listingId: number) => Review[]
}

const ReviewsContext = createContext<ReviewsContextType | null>(null)

let localSeq = 0

export function ReviewsProvider({ children }: { children: ReactNode }) {
  const { user, accessToken } = useAuth()
  const [userReviews, setUserReviews] = useState<Review[]>([])
  const [apiReviews, setApiReviews] = useState<Review[]>([])

  useEffect(() => {
    fetch(`${getApiUrl()}/api/reviews`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (Array.isArray(data) && data.length) setApiReviews(data)
      })
      .catch(() => {})
  }, [])

  const addReview: ReviewsContextType['addReview'] = ({ listingId, rating, text }) => {
    localSeq += 1
    const review: Review = {
      id: 9000 + localSeq,
      listingId,
      user: user?.name ?? 'Guest',
      avatar: '',
      rating,
      date: 'Just now',
      text,
      verified: true,
    }
    setUserReviews(prev => [review, ...prev])

    if (accessToken) {
      fetch(`${getApiUrl()}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ listingId, rating, text }),
      }).catch(() => {})
    }

    return review
  }

  const baseReviews = apiReviews.length > 0 ? apiReviews : seedReviews
  const allReviews  = [...userReviews, ...baseReviews]
  const reviewsFor  = (listingId: number) => allReviews.filter(r => r.listingId === listingId)

  return (
    <ReviewsContext.Provider value={{ userReviews, allReviews, addReview, reviewsFor }}>
      {children}
    </ReviewsContext.Provider>
  )
}

export function useReviews() {
  const ctx = useContext(ReviewsContext)
  if (!ctx) throw new Error('useReviews must be used within ReviewsProvider')
  return ctx
}
