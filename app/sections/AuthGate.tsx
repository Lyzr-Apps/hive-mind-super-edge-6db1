'use client'

import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RiShieldKeyholeLine, RiLockLine } from 'react-icons/ri'

interface AuthGateProps {
  onAuthenticated: () => void
}

const CORRECT_PASSWORD = 'hive2024'
const CORRECT_PIN = '1234'

export default function AuthGate({ onAuthenticated }: AuthGateProps) {
  const [step, setStep] = useState<'password' | 'pin'>('password')
  const [password, setPassword] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [verifying, setVerifying] = useState(false)

  const handlePasswordSubmit = useCallback(() => {
    setError('')
    if (password === CORRECT_PASSWORD) {
      setStep('pin')
      setPassword('')
    } else {
      setError('Access denied. Invalid password.')
    }
  }, [password])

  const handlePinDigit = useCallback((digit: string) => {
    if (pin.length >= 4) return
    const newPin = pin + digit
    setPin(newPin)
    setError('')

    if (newPin.length === 4) {
      setVerifying(true)
      setTimeout(() => {
        if (newPin === CORRECT_PIN) {
          onAuthenticated()
        } else {
          setError('Invalid PIN. Access denied.')
          setPin('')
          setVerifying(false)
        }
      }, 1200)
    }
  }, [pin, onAuthenticated])

  const handlePinBackspace = useCallback(() => {
    setPin(prev => prev.slice(0, -1))
    setError('')
  }, [])

  if (step === 'password') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card border-border shadow-[0_4px_40px_rgba(139,92,246,0.2)]">
          <CardHeader className="text-center space-y-4 pb-2">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
              <RiShieldKeyholeLine className="w-8 h-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-4xl font-bold tracking-tight bg-gradient-to-r from-purple-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">HIVE</CardTitle>
              <p className="text-muted-foreground text-sm mt-1 tracking-widest uppercase">Command Center</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Enter access password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                className="bg-input border-border text-foreground placeholder:text-muted-foreground h-12 text-center tracking-widest"
              />
            </div>
            {error && (
              <p className="text-destructive text-sm text-center font-medium">{error}</p>
            )}
            <Button
              onClick={handlePasswordSubmit}
              disabled={!password}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold tracking-wide shadow-[0_4px_20px_rgba(139,92,246,0.3)]"
            >
              <RiLockLine className="w-4 h-4 mr-2" />
              Access
            </Button>
            <p className="text-xs text-muted-foreground text-center">Authorized personnel only</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card border-border shadow-[0_4px_40px_rgba(139,92,246,0.2)]">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
            <RiLockLine className="w-8 h-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground">Enter Security PIN</CardTitle>
            <p className="text-muted-foreground text-sm mt-1">4-digit verification required</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          <div className="flex justify-center gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full transition-all duration-300 ${i < pin.length ? 'bg-primary shadow-[0_0_12px_rgba(139,92,246,0.5)]' : 'bg-muted border border-border'}`}
              />
            ))}
          </div>

          {verifying && (
            <div className="text-center">
              <p className="text-primary text-sm animate-pulse font-medium">Verifying...</p>
            </div>
          )}

          {error && (
            <p className="text-destructive text-sm text-center font-medium">{error}</p>
          )}

          <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((key) => {
              if (key === '') return <div key="empty" />
              if (key === 'del') {
                return (
                  <Button
                    key="del"
                    variant="outline"
                    onClick={handlePinBackspace}
                    disabled={verifying || pin.length === 0}
                    className="h-14 text-sm bg-secondary/50 border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    Del
                  </Button>
                )
              }
              return (
                <Button
                  key={key}
                  variant="outline"
                  onClick={() => handlePinDigit(key)}
                  disabled={verifying || pin.length >= 4}
                  className="h-14 text-lg font-mono bg-secondary/50 border-border text-foreground hover:bg-primary/20 hover:text-primary hover:border-primary/50 transition-all"
                >
                  {key}
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
