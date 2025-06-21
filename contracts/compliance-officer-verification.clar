;; Compliance Officer Verification Contract
;; Manages verification and authorization of compliance officers

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-unauthorized (err u101))
(define-constant err-already-verified (err u102))
(define-constant err-not-verified (err u103))
(define-constant err-invalid-officer (err u104))

;; Data Variables
(define-data-var next-officer-id uint u1)

;; Data Maps
(define-map compliance-officers
  { officer-id: uint }
  {
    principal: principal,
    name: (string-ascii 64),
    certification: (string-ascii 128),
    verified: bool,
    verification-date: uint,
    expiry-date: uint
  }
)

(define-map officer-principals
  { principal: principal }
  { officer-id: uint }
)

;; Public Functions

;; Register a new compliance officer
(define-public (register-officer (name (string-ascii 64)) (certification (string-ascii 128)) (expiry-date uint))
  (let (
    (officer-id (var-get next-officer-id))
    (caller tx-sender)
  )
    (asserts! (is-eq caller contract-owner) err-owner-only)
    (asserts! (is-none (map-get? officer-principals { principal: caller })) err-already-verified)

    (map-set compliance-officers
      { officer-id: officer-id }
      {
        principal: caller,
        name: name,
        certification: certification,
        verified: false,
        verification-date: u0,
        expiry-date: expiry-date
      }
    )

    (map-set officer-principals
      { principal: caller }
      { officer-id: officer-id }
    )

    (var-set next-officer-id (+ officer-id u1))
    (ok officer-id)
  )
)

;; Verify a compliance officer
(define-public (verify-officer (officer-id uint))
  (let (
    (officer-data (unwrap! (map-get? compliance-officers { officer-id: officer-id }) err-invalid-officer))
  )
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)

    (map-set compliance-officers
      { officer-id: officer-id }
      (merge officer-data {
        verified: true,
        verification-date: block-height
      })
    )
    (ok true)
  )
)

;; Check if principal is verified officer
(define-public (is-verified-officer (principal principal))
  (match (map-get? officer-principals { principal: principal })
    officer-record
      (match (map-get? compliance-officers { officer-id: (get officer-id officer-record) })
        officer-data (ok (get verified officer-data))
        (ok false)
      )
    (ok false)
  )
)

;; Read-only functions
(define-read-only (get-officer-info (officer-id uint))
  (map-get? compliance-officers { officer-id: officer-id })
)

(define-read-only (get-officer-by-principal (principal principal))
  (match (map-get? officer-principals { principal: principal })
    officer-record (map-get? compliance-officers { officer-id: (get officer-id officer-record) })
    none
  )
)
