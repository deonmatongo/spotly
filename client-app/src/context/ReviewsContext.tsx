import React, { createContext, useContext, useState, ReactNode } from 'react'
import { reviews as seedReviews, Review } from '../data/mock'
import { currentUser } from '../data/mock'

interface ReviewsContextType {
  userReviews: Review[]
  allReviews: Review[]
  addReview: (input: { listingId: number; rating: number; text: string }) => Review
  reviewsFor: (listingId: number) => Review[]
}

const ReviewsContext = createContext<ReviewsContextType | null>(null)

let seq = 0

export function ReviewsProvider({ children }: { children: ReactNode }) {
  const [userReviews, setUserReviews] = useState<Review[]>([])

  const addReview: ReviewsContextType['addReview'] = ({ listingId, rating, text }) => {
    seq += 1
    const review: Review = {
      id: 9000 + seq,
      listingId,
      user: currentUser.name,
      avatar: currentUser.avatar,
      rating,
      date: 'Just now',
      text,
      verified: true,
    }
    setUserReviews(prev => [review, ...prev])
    return review
  }

  const allReviews = [...userReviews, ...seedReviews]
  const reviewsFor = (listingId: number) => allReviews.filter(r => r.listingId === listingId)

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
