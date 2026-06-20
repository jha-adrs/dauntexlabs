'use client'

import { useMemo, useState } from 'react'
import { Field, TextInput, Select, Button, Notice } from '@/components/ui/kit'

/* Standard 4.0 US grade scale (letter → grade points). */
const GRADE_POINTS: { value: string; label: string; points: number }[] = [
  { value: 'A', label: 'A (4.0)', points: 4.0 },
  { value: 'A-', label: 'A- (3.7)', points: 3.7 },
  { value: 'B+', label: 'B+ (3.3)', points: 3.3 },
  { value: 'B', label: 'B (3.0)', points: 3.0 },
  { value: 'B-', label: 'B- (2.7)', points: 2.7 },
  { value: 'C+', label: 'C+ (2.3)', points: 2.3 },
  { value: 'C', label: 'C (2.0)', points: 2.0 },
  { value: 'C-', label: 'C- (1.7)', points: 1.7 },
  { value: 'D+', label: 'D+ (1.3)', points: 1.3 },
  { value: 'D', label: 'D (1.0)', points: 1.0 },
  { value: 'F', label: 'F (0.0)', points: 0.0 },
]

const POINTS_BY_VALUE: Record<string, number> = Object.fromEntries(
  GRADE_POINTS.map((g) => [g.value, g.points]),
)

type Course = { id: number; name: string; grade: string; credits: string }

let nextId = 1
function makeCourse(grade = 'A', credits = ''): Course {
  return { id: nextId++, name: '', grade, credits }
}

export default function GpaCalculator() {
  const [courses, setCourses] = useState<Course[]>([
    makeCourse('A', '3'),
    makeCourse('B', '3'),
  ])

  function update(id: number, patch: Partial<Course>) {
    setCourses((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  }
  function addCourse() {
    setCourses((cs) => [...cs, makeCourse()])
  }
  function removeCourse(id: number) {
    setCourses((cs) => cs.filter((c) => c.id !== id))
  }

  const { gpa, totalCredits, error } = useMemo(() => {
    let weighted = 0
    let credits = 0
    let anyInvalid = false
    for (const c of courses) {
      const raw = c.credits.trim()
      if (raw === '') continue // skip blank-credit rows silently
      const cr = Number(raw)
      if (!Number.isFinite(cr) || cr < 0) {
        anyInvalid = true
        continue
      }
      const pts = POINTS_BY_VALUE[c.grade] ?? 0
      weighted += pts * cr
      credits += cr
    }
    if (anyInvalid)
      return {
        gpa: null as number | null,
        totalCredits: credits,
        error: 'Credit hours must be a number ≥ 0.',
      }
    if (credits === 0)
      return { gpa: null as number | null, totalCredits: 0, error: '' }
    return { gpa: weighted / credits, totalCredits: credits, error: '' }
  }, [courses])

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {courses.map((c, i) => (
          <div
            key={c.id}
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0,1fr) 9rem 7rem auto',
              gap: '0.6rem',
              alignItems: 'end',
            }}
          >
            <Field label={i === 0 ? 'course' : undefined}>
              <TextInput
                value={c.name}
                onChange={(v) => update(c.id, { name: v })}
                placeholder={`Course ${i + 1}`}
              />
            </Field>
            <Field label={i === 0 ? 'grade' : undefined}>
              <Select
                value={c.grade}
                onChange={(v) => update(c.id, { grade: v })}
                options={GRADE_POINTS.map((g) => ({ value: g.value, label: g.label }))}
              />
            </Field>
            <Field label={i === 0 ? 'credits' : undefined}>
              <TextInput
                type="number"
                value={c.credits}
                onChange={(v) => update(c.id, { credits: v })}
                placeholder="0"
              />
            </Field>
            <Button
              variant="danger"
              onClick={() => removeCourse(c.id)}
              disabled={courses.length === 1}
              title="Remove course"
            >
              ✕
            </Button>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '1rem' }}>
        <Button variant="ghost" onClick={addCourse}>
          + Add course
        </Button>
      </div>

      {error && (
        <div style={{ marginTop: '1rem' }}>
          <Notice kind="error">{error}</Notice>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(11rem, 1fr))',
          gap: '0.75rem',
          marginTop: '1.25rem',
        }}
      >
        <ResultCard label="GPA" value={gpa === null ? '—' : gpa.toFixed(2)} accent />
        <ResultCard label="Total credits" value={String(totalCredits)} />
      </div>
    </>
  )
}

function ResultCard({
  label,
  value,
  accent = false,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div
      style={{
        border: '1px solid var(--line)',
        background: 'var(--ink-850)',
        borderRadius: 8,
        padding: '0.9rem 1rem',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.72rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--mute)',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '1.6rem',
          marginTop: '0.35rem',
          color: accent ? 'var(--acid)' : 'var(--bone)',
        }}
      >
        {value}
      </div>
    </div>
  )
}
