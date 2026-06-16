import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CaretLeftIcon } from '@phosphor-icons/react/dist/ssr'
import type { DiffResult, Feature } from '@/lib/types'
import { IMPACT } from '@/lib/impact-data'
import { SubcategoryList } from './SubcategoryList'
import type { SubcategoryGroup, JobCommit } from './SubcategoryList'
import { SprintReviewRightPanel } from '../SprintReviewRightPanel'
import { getProjectMock } from '@/lib/sprint-mocks'
import { compareConditions } from '@/lib/compare-conditions'
import type { ConditionResult } from '@/lib/types'

export default async function CategoryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ cat?: string; sprintId?: string }>
}) {
  const { id } = await params
  const { cat, sprintId } = await searchParams

  if (!cat) notFound()

  const project = await db.project.findUnique({ where: { id } })
  if (!project) notFound()

  const projectMock = getProjectMock(project.name)
  const mockRequirements = projectMock?.requirements ?? []

  const latestJob = await db.analysisJob.findFirst({
    where: { projectId: id, status: 'DONE' },
    orderBy: { triggeredAt: 'desc' },
    include: { updateDoc: true },
  })

  const latestDoc = await db.knowledgeDoc.findFirst({
    where: { projectId: id },
    orderBy: { version: 'desc' },
  })
  const allFeatures = (latestDoc?.features as unknown as Feature[]) ?? []

  const hasPendingDiff = !!latestJob?.updateDoc && latestJob.updateDoc.status === 'PENDING'
  const diff: DiffResult = hasPendingDiff
    ? (latestJob!.updateDoc!.diff as unknown as DiffResult)
    : { added: [], modified: [], removed: [] }

  const sprints = await db.sprint.findMany({
    where: { projectId: id },
    include: { requirements: true },
    orderBy: { createdAt: 'asc' },
  })
  const activeSprintRaw = (sprintId ? sprints.find(s => s.id === sprintId) : null) ?? sprints.find(s => s.status === 'OPEN') ?? sprints[sprints.length - 1] ?? null
  const allSprintRequirements = activeSprintRaw?.requirements ?? []
  const activeSprint = activeSprintRaw ? {
        id: activeSprintRaw.id,
        name: activeSprintRaw.name,
        status: activeSprintRaw.status as 'OPEN' | 'CLOSED',
        requirements: activeSprintRaw.requirements.map(r => ({
          id: r.id,
          fileName: r.fileName ?? null,
          createdBy: r.createdBy,
          items: r.items as unknown as any[],
        })),
      } : null

  if (!hasPendingDiff && allSprintRequirements.length === 0) notFound()

  type RawItem = {
    id: string
    changeType: 'added' | 'modified' | 'removed'
    subcategory: string
    feature: Feature
    oldFeature: Feature | null
  }

  const allItems: RawItem[] = [
    ...(diff.added ?? []).map(f => ({ id: f.id, changeType: 'added' as const, subcategory: f.subcategory ?? '', feature: f, oldFeature: null })),
    ...(diff.modified ?? []).map(c => ({ id: c.new.id, changeType: 'modified' as const, subcategory: c.new.subcategory ?? '', feature: c.new, oldFeature: c.old })),
    ...(diff.removed ?? []).map(f => ({ id: f.id, changeType: 'removed' as const, subcategory: f.subcategory ?? '', feature: f, oldFeature: null })),
  ]

  const allReqCategories = allSprintRequirements
    .flatMap(r => r.items as any[])
    .map(r => (r.category ?? 'ทั่วไป') as string)

  const allCategories = [...new Set([
    ...allItems.map(i => i.feature.category ?? 'ทั่วไป'),
    ...allReqCategories,
  ])]

  const catItems = allItems.filter(i => (i.feature.category ?? 'ทั่วไป') === cat)

  const subMap = new Map<string, RawItem[]>()
  for (const item of catItems) {
    if (!subMap.has(item.subcategory)) subMap.set(item.subcategory, [])
    subMap.get(item.subcategory)!.push(item)
  }

  const allReqItems: any[] = allSprintRequirements.flatMap(r => r.items as any[])
  const reqMap = new Map<string, any>()
  for (const r of allReqItems) {
    reqMap.set(r.featureId, r)
    // also map base featureId (strip -partN suffix) so diff items still match
    const baseId = r.featureId.replace(/-part\d+$/, '')
    if (baseId !== r.featureId && !reqMap.has(baseId)) reqMap.set(baseId, r)
  }
  const hasReq = allReqItems.length > 0

  // Requirements for this category not yet implemented (not in diff) → show as pending or incorrect
  const diffFeatureIds = new Set(allItems.map(i => i.id))
  const pendingReqItems = hasReq
    ? allReqItems.filter((r: any) => {
        if (r.category !== cat) return false
        if (diffFeatureIds.has(r.featureId)) return false
        // ถ้าเป็น split item (part1) และ base featureId อยู่ใน diff แล้ว → ไม่ต้องแสดงซ้ำ
        const baseId = r.featureId.replace(/-part\d+$/, '')
        if (baseId !== r.featureId && diffFeatureIds.has(baseId)) return false
        return true
      })
    : []

  for (const r of pendingReqItems) {
    const sub: string = r.subcategory ?? ''
    if (!subMap.has(sub)) subMap.set(sub, [])
    subMap.get(sub)!.push({
      id: r.featureId,
      changeType: r.changeType === 'remove' ? 'removed' : r.changeType === 'modify' ? 'modified' : 'added',
      subcategory: sub,
      feature: { id: r.featureId, title: r.title, description: r.description, category: cat, subcategory: sub } as Feature,
      oldFeature: null,
      _synthetic: true,
      _reqChangeType: r.changeType as string,
      _reqEntry: r,
    } as any)
  }

  const jobCommit: JobCommit | null = latestJob ? {
    sha: latestJob.commitSha,
    message: latestJob.commitMsg ?? '',
    author: latestJob.author,
    date: latestJob.triggeredAt.toISOString(),
  } : null

  const groups: SubcategoryGroup[] = await Promise.all(
    Array.from(subMap.entries()).map(async ([sub, its]) => ({
      sub,
      items: await Promise.all(its.map(async (i: any) => {
        if (i._synthetic) {
          const reqEntry = i._reqEntry as any
          // ยังไม่มีโค้ด → ทุก condition เป็น missing อัตโนมัติ
          const rawConditions: any[] = reqEntry.conditions?.length
            ? reqEntry.conditions
            : [{ id: `mock-${i.id}-1`, description: reqEntry.title ?? i.feature.title }]
          const conditions: ConditionResult[] = rawConditions.map((c: any) => ({
            id: c.id,
            description: c.description,
            status: 'missing' as const,
          }))
          return {
            id: i.id,
            changeType: i.changeType,
            oldTitle: null,
            oldDescription: null,
            newTitle: reqEntry.title ?? i.feature.title,
            newDescription: reqEntry.description ?? i.feature.description ?? null,
            impact: null,
            reqStatus: 'pending' as const,
            reqNote: reqEntry.title ?? null,
            reqChangeType: (reqEntry.changeType ?? null) as 'add' | 'modify' | 'remove' | null,
            isSynthetic: true,
            commits: [],
            conditions,
          }
        }

        const req = reqMap.get(i.id)
        const reqChangeType = req?.changeType as string | undefined
        let reqStatus: 'done' | 'incorrect' | 'no-req' | null = null
        let changeTypeMismatchReason: string | null = null
        if (hasReq) {
          if (reqChangeType === 'add' && i.changeType === 'added') {
            reqStatus = 'done'
          } else if (reqChangeType === 'add') {
            reqStatus = 'incorrect'
            const actual = i.changeType === 'modified' ? 'แก้ไขของเดิม' : i.changeType === 'removed' ? 'ลบออก' : i.changeType
            changeTypeMismatchReason = `Req ต้องการเพิ่มฟีเจอร์ใหม่ แต่โค้ดทำการ${actual}`
          } else {
            reqStatus = 'no-req'
          }
        }

        let conditions: ConditionResult[] = []
        let conditionsCompared = false
        const reqConditions = (req as any)?.conditions?.length
          ? (req as any).conditions
          : req ? [{ id: `mock-${i.id}-1`, description: (req as any).title ?? i.feature.title }] : []

        if (reqConditions.length) {
          try {
            conditions = await compareConditions(reqConditions, i.feature.description ?? '')
            conditionsCompared = true
          } catch {
            // mock: ถ้า reqStatus done → match ทั้งหมด, ถ้าไม่ → สลับ wrong/missing
            conditions = reqConditions.map((c: any, idx: number) => ({
              id: c.id,
              description: c.description,
              status: reqStatus === 'done' ? ('match' as const) : idx % 2 === 0 ? ('wrong' as const) : ('missing' as const),
              note: reqStatus !== 'done' && idx % 2 === 0 ? `โค้ดทำ: ${i.feature.description?.slice(0, 60) ?? '—'}` : undefined,
            }))
            conditionsCompared = true
          }
          // ให้ conditions เป็นตัวตัดสิน reqStatus เฉพาะเมื่อ compare สำเร็จ
          if (conditionsCompared && reqStatus === 'done') {
            const hasIssue = conditions.some(c => c.status === 'wrong' || c.status === 'missing')
            if (hasIssue) reqStatus = 'incorrect'
          }
        }

        return {
          id: i.id,
          changeType: i.changeType,
          oldTitle: null,
          oldDescription: null,
          newTitle: i.feature.title,
          newDescription: i.feature.description ?? null,
          impact: IMPACT[i.feature.id] ?? null,
          reqStatus,
          reqNote: (req as any)?.title ?? null,
          reqChangeType: (req as any)?.changeType ?? null,
          isSynthetic: false,
          commits: jobCommit ? [jobCommit] : [],
          conditions,
          changeTypeMismatchReason,
        }
      })).then(items => items.sort((a, b) => {
        const order = { pending: 0, 'no-req': 1, incorrect: 2, done: 3, null: 4 }
        return (order[a.reqStatus as keyof typeof order] ?? 4) - (order[b.reqStatus as keyof typeof order] ?? 4)
      })),
    }))
  )

  // MOCK: แสดงครบ 4 เคส แยกตาม category
  type MockItem = SubcategoryGroup['items'][0]
  function m(id: string, newTitle: string, newDescription: string, reqStatus: 'done'|'incorrect'|'pending'|'no-req', reqNote: string|null, conditions: ConditionResult[], isSynthetic = false): MockItem {
    return { id, changeType: 'added', oldTitle: null, oldDescription: null, newTitle, newDescription, impact: null, reqStatus, reqNote, reqChangeType: reqStatus !== 'no-req' ? 'add' : null, isSynthetic, commits: [], changeTypeMismatchReason: null, conditions }
  }
  const MOCK_BY_CAT: Record<string, SubcategoryGroup[]> = {
    'การเข้าสู่ระบบและลงทะเบียน': [{
      sub: 'การตรวจสอบสิทธิ์',
      items: [
        m('mk-auth-done', 'เข้าสู่ระบบด้วย Username/Password', 'ระบบ login มาตรฐาน รองรับ remember me และ force logout session เก่า', 'done', 'ผู้ใช้สามารถเข้าสู่ระบบด้วย Username และ Password ได้', [
          { id: 'mk-a-c1', description: 'ตรวจสอบ Username และ Password กับฐานข้อมูล', status: 'match', note: undefined },
          { id: 'mk-a-c2', description: 'รองรับ Remember me เก็บ session 30 วัน', status: 'match', note: undefined },
          { id: 'mk-a-c3', description: 'Force logout session เก่าเมื่อ login ใหม่', status: 'match', note: undefined },
        ]),
        m('mk-auth-wrong', 'ยืนยันตัวตน 2 ขั้นตอน (OTP)', 'ระบบส่ง OTP ผ่าน SMS แต่ยังไม่รองรับ OTP ผ่าน Email', 'incorrect', 'ยืนยันตัวตนด้วย OTP ผ่าน SMS หรือ Email ได้', [
          { id: 'mk-a-c4', description: 'ส่ง OTP ผ่าน SMS ได้', status: 'match', note: undefined },
          { id: 'mk-a-c5', description: 'ส่ง OTP ผ่าน Email ได้', status: 'wrong', note: 'โค้ดทำ: รองรับเฉพาะ SMS ยังไม่ได้ทำ Email OTP' },
          { id: 'mk-a-c6', description: 'OTP หมดอายุหลัง 5 นาที', status: 'match', note: undefined },
        ]),
        m('mk-auth-pending', 'Username ไม่สามารถกรอกภาษาไทยได้', 'Validate ให้ Username รับได้เฉพาะ a-z, 0-9 และ _ เท่านั้น', 'pending', 'Username รองรับเฉพาะภาษาอังกฤษและตัวเลข', [
          { id: 'mk-a-c7', description: 'Validate ห้ามกรอก Unicode ภาษาไทยใน Username', status: 'missing', note: undefined },
          { id: 'mk-a-c8', description: 'แสดง error message "Username ต้องเป็นภาษาอังกฤษเท่านั้น"', status: 'missing', note: undefined },
        ], true),
        m('mk-auth-noreq', 'สามารถกดแสดงหรือซ่อนรหัสผ่านได้', 'ปุ่ม toggle แสดง/ซ่อน password ในช่อง input', 'no-req', null, []),
      ],
    }],
    'จัดการสินค้าในคลัง': [{
      sub: 'การจัดการสต็อก',
      items: [
        m('mk-inv-done', 'เพิ่มสินค้าใหม่เข้าคลัง', 'พนักงานกรอกชื่อสินค้า หมวดหมู่ จำนวน ราคาต้นทุน และกำหนด Reorder Point ระบบบันทึกและแสดงสินค้าใหม่ในรายการทันที', 'done', 'พนักงานสามารถเพิ่มสินค้าใหม่พร้อมกำหนด Reorder Point ได้', [
          { id: 'mk-i-c1', description: 'กรอกชื่อสินค้า หมวดหมู่ จำนวน และราคาต้นทุนได้', status: 'match', note: undefined },
          { id: 'mk-i-c2', description: 'กำหนดค่า Reorder Point ต่อสินค้าได้', status: 'match', note: undefined },
          { id: 'mk-i-c3', description: 'สินค้าใหม่แสดงในรายการทันทีหลังบันทึก', status: 'match', note: undefined },
        ]),
        m('mk-inv-wrong', 'ค้นหาสินค้าในคลัง', 'ค้นหาด้วย keyword ชื่อสินค้า แสดงผลทันทีขณะพิมพ์ ยังไม่รองรับกรองหลายเงื่อนไขพร้อมกัน', 'incorrect', 'ค้นหาสินค้าได้หลายเงื่อนไขพร้อมกัน และบันทึกประวัติการค้นหา', [
          { id: 'mk-i-c4', description: 'ค้นหาได้หลายเงื่อนไขพร้อมกัน (ชื่อ + หมวดหมู่ + ราคา)', status: 'wrong', note: 'โค้ดทำ: ค้นหาได้เฉพาะชื่อสินค้าเท่านั้น' },
          { id: 'mk-i-c5', description: 'แสดงผลการค้นหาแบบ real-time ขณะพิมพ์', status: 'match', note: undefined },
          { id: 'mk-i-c6', description: 'บันทึกประวัติการค้นหา 10 รายการล่าสุด', status: 'missing', note: undefined },
        ]),
        m('mk-inv-pending', 'แจ้งเตือนเมื่อสินค้าใกล้หมด', 'ตรวจสอบ stock เทียบ Reorder Point และแจ้งเตือนผ่าน LINE Notify', 'pending', 'แจ้งเตือนผ่าน LINE Notify เมื่อสินค้าต่ำกว่า Reorder Point', [
          { id: 'mk-i-c7', description: 'ตรวจสอบ stock เทียบ Reorder Point ทุก 1 ชั่วโมง', status: 'missing', note: undefined },
          { id: 'mk-i-c8', description: 'ส่งข้อความแจ้งเตือนผ่าน LINE Notify พร้อมชื่อสินค้าและจำนวนคงเหลือ', status: 'missing', note: undefined },
        ], true),
        m('mk-inv-noreq', 'Export รายงานสต็อกเป็น PDF', 'ส่งออกรายงานสรุปสินค้าทั้งหมดพร้อมสถานะ stock เป็นไฟล์ PDF', 'no-req', null, []),
      ],
    }],
    'รับและส่งสินค้า': [{
      sub: 'การรับสินค้า',
      items: [
        m('mk-recv-done', 'บันทึกการรับสินค้าจาก Supplier', 'สแกน barcode หรือกรอกรหัสสินค้า ระบุจำนวนที่รับจริง และอัปเดต stock อัตโนมัติ', 'done', 'พนักงานบันทึกการรับสินค้าและอัปเดต stock ได้', [
          { id: 'mk-r-c1', description: 'สแกน barcode หรือกรอกรหัสสินค้าได้', status: 'match', note: undefined },
          { id: 'mk-r-c2', description: 'ระบุจำนวนที่รับจริงและอัปเดต stock อัตโนมัติ', status: 'match', note: undefined },
        ]),
        m('mk-recv-wrong', 'พิมพ์ใบรับสินค้า', 'พิมพ์ใบรับสินค้าได้แต่ยังไม่มีลายเซ็น QR code', 'incorrect', 'พิมพ์ใบรับสินค้าพร้อม QR code อ้างอิงเลขที่รับ', [
          { id: 'mk-r-c3', description: 'พิมพ์ใบรับสินค้าพร้อมข้อมูลครบถ้วน', status: 'match', note: undefined },
          { id: 'mk-r-c4', description: 'มี QR code อ้างอิงเลขที่รับสินค้าบนใบ', status: 'wrong', note: 'โค้ดทำ: พิมพ์ใบได้แต่ไม่มี QR code' },
        ]),
        m('mk-recv-pending', 'แจ้ง Supervisor เมื่อสินค้าที่รับไม่ตรงกับ PO', 'เปรียบเทียบจำนวนที่รับกับ PO อัตโนมัติ และส่ง notification ให้ Supervisor', 'pending', 'ระบบแจ้งเตือน Supervisor เมื่อจำนวนรับไม่ตรง PO', [
          { id: 'mk-r-c5', description: 'เปรียบเทียบจำนวนรับกับ PO อัตโนมัติ', status: 'missing', note: undefined },
          { id: 'mk-r-c6', description: 'ส่ง notification ให้ Supervisor ทันที', status: 'missing', note: undefined },
        ], true),
        m('mk-recv-noreq', 'ถ่ายรูปสินค้าที่รับเข้าแนบกับใบรับ', 'อัปโหลดรูปสินค้าแนบกับเอกสารรับสินค้า', 'no-req', null, []),
      ],
    }],
    'เบิก-จ่ายสินค้า': [{
      sub: 'การเบิกสินค้า',
      items: [
        m('mk-disp-done', 'สร้างใบเบิกสินค้า', 'พนักงานเลือกสินค้าและระบุจำนวนที่ต้องการ ระบบตรวจสอบ stock ก่อนอนุมัติ', 'done', 'พนักงานสร้างใบเบิกสินค้าพร้อมตรวจสอบ stock ได้', [
          { id: 'mk-d-c1', description: 'เลือกสินค้าและระบุจำนวนที่ต้องการเบิก', status: 'match', note: undefined },
          { id: 'mk-d-c2', description: 'ตรวจสอบ stock ก่อนอนุมัติการเบิก', status: 'match', note: undefined },
          { id: 'mk-d-c3', description: 'แสดง error เมื่อ stock ไม่เพียงพอ', status: 'match', note: undefined },
        ]),
        m('mk-disp-wrong', 'อนุมัติใบเบิกโดย Supervisor', 'Supervisor กดอนุมัติได้แต่ยังไม่สามารถแนบหมายเหตุปฏิเสธได้', 'incorrect', 'Supervisor อนุมัติหรือปฏิเสธใบเบิกพร้อมหมายเหตุ', [
          { id: 'mk-d-c4', description: 'Supervisor อนุมัติใบเบิกได้', status: 'match', note: undefined },
          { id: 'mk-d-c5', description: 'Supervisor ปฏิเสธพร้อมระบุหมายเหตุได้', status: 'wrong', note: 'โค้ดทำ: ปฏิเสธได้แต่ไม่มีช่องกรอกหมายเหตุ' },
        ]),
        m('mk-disp-pending', 'ประวัติการเบิกสินค้าย้อนหลัง 90 วัน', 'แสดงรายการเบิกทั้งหมดพร้อมกรองตามแผนกและช่วงวันที่', 'pending', 'ดูประวัติการเบิกย้อนหลัง 90 วันกรองตามแผนกได้', [
          { id: 'mk-d-c6', description: 'แสดงรายการเบิกย้อนหลัง 90 วัน', status: 'missing', note: undefined },
          { id: 'mk-d-c7', description: 'กรองตามแผนกและช่วงวันที่ได้', status: 'missing', note: undefined },
        ], true),
        m('mk-disp-noreq', 'Export ใบเบิกเป็นไฟล์ Excel', 'ส่งออกรายการใบเบิกเป็น .xlsx', 'no-req', null, []),
      ],
    }],
    'ตรวจนับสินค้า': [{
      sub: 'การตรวจนับ',
      items: [
        m('mk-cnt-done', 'สร้างรอบการตรวจนับสินค้า', 'ผู้ดูแลสร้างรอบนับกำหนดสินค้าที่ต้องนับและมอบหมายทีม', 'done', 'ผู้ดูแลสร้างรอบตรวจนับพร้อมมอบหมายทีมได้', [
          { id: 'mk-c-c1', description: 'สร้างรอบนับและเลือกสินค้าที่ต้องตรวจนับ', status: 'match', note: undefined },
          { id: 'mk-c-c2', description: 'มอบหมายทีมผู้ตรวจนับแต่ละรายการ', status: 'match', note: undefined },
        ]),
        m('mk-cnt-wrong', 'บันทึกผลการตรวจนับ', 'บันทึกจำนวนจริงได้แต่ยังไม่คำนวณส่วนต่างกับระบบอัตโนมัติ', 'incorrect', 'บันทึกจำนวนจริงและแสดงส่วนต่างกับระบบทันที', [
          { id: 'mk-c-c3', description: 'กรอกจำนวนที่นับได้จริง', status: 'match', note: undefined },
          { id: 'mk-c-c4', description: 'แสดงส่วนต่างเทียบกับ stock ในระบบทันที', status: 'wrong', note: 'โค้ดทำ: บันทึกได้แต่ต้องกด refresh ถึงจะเห็นส่วนต่าง' },
        ]),
        m('mk-cnt-pending', 'รายงานสรุปผลการตรวจนับ', 'สรุปสินค้าที่ตรงและไม่ตรง พร้อมมูลค่าส่วนต่าง', 'pending', 'รายงานสรุปผลนับพร้อมมูลค่าส่วนต่างทั้งหมด', [
          { id: 'mk-c-c5', description: 'สรุปรายการที่ stock ตรงและไม่ตรง', status: 'missing', note: undefined },
          { id: 'mk-c-c6', description: 'แสดงมูลค่าส่วนต่างรวม', status: 'missing', note: undefined },
        ], true),
        m('mk-cnt-noreq', 'ถ่ายรูปสินค้าขณะตรวจนับ', 'อัปโหลดรูปสินค้าแนบกับรายการตรวจนับ', 'no-req', null, []),
      ],
    }],
    'รายงานและสถิติ': [{
      sub: 'รายงานสรุป',
      items: [
        m('mk-rpt-done', 'รายงานการเคลื่อนไหวสินค้าประจำวัน', 'แสดงยอดรับ เบิก และ stock คงเหลือรายวัน กรองตามหมวดหมู่ได้', 'done', 'รายงานการเคลื่อนไหวสินค้ารายวันกรองตามหมวดหมู่', [
          { id: 'mk-rp-c1', description: 'แสดงยอดรับ เบิก และ stock คงเหลือรายวัน', status: 'match', note: undefined },
          { id: 'mk-rp-c2', description: 'กรองตามหมวดหมู่สินค้าได้', status: 'match', note: undefined },
        ]),
        m('mk-rpt-wrong', 'กราฟแนวโน้ม stock รายเดือน', 'กราฟแสดงข้อมูลรายเดือนแต่ยังไม่รองรับเปรียบเทียบหลายหมวดพร้อมกัน', 'incorrect', 'กราฟแนวโน้ม stock เปรียบเทียบหลายหมวดหมู่', [
          { id: 'mk-rp-c3', description: 'กราฟแสดงแนวโน้ม stock รายเดือน', status: 'match', note: undefined },
          { id: 'mk-rp-c4', description: 'เปรียบเทียบหลายหมวดหมู่พร้อมกันบนกราฟเดียว', status: 'wrong', note: 'โค้ดทำ: ดูได้ทีละหมวด ยังไม่ overlay หลายหมวด' },
        ]),
        m('mk-rpt-pending', 'รายงานสินค้าที่ใกล้หมดอายุ', 'แสดงรายการสินค้าที่จะหมดอายุภายใน 30 วัน พร้อมจำนวนคงเหลือ', 'pending', 'รายงานสินค้าใกล้หมดอายุภายใน 30 วัน', [
          { id: 'mk-rp-c5', description: 'กรองสินค้าที่หมดอายุภายใน 30 วัน', status: 'missing', note: undefined },
          { id: 'mk-rp-c6', description: 'แสดงจำนวนคงเหลือและวันหมดอายุ', status: 'missing', note: undefined },
        ], true),
        m('mk-rpt-noreq', 'Export กราฟเป็นไฟล์รูปภาพ', 'บันทึกกราฟเป็น PNG สำหรับนำไปใช้งาน', 'no-req', null, []),
      ],
    }],
    'จัดการผู้ใช้งาน': [{
      sub: 'สิทธิ์และบัญชีผู้ใช้',
      items: [
        m('mk-usr-done', 'เพิ่มผู้ใช้งานใหม่', 'Admin กรอกชื่อ email และเลือก role ระบบส่ง email ตั้งรหัสผ่านให้ผู้ใช้อัตโนมัติ', 'done', 'Admin เพิ่มผู้ใช้ใหม่และระบบส่ง email ตั้งรหัสผ่าน', [
          { id: 'mk-u-c1', description: 'กรอกชื่อ email และกำหนด role ได้', status: 'match', note: undefined },
          { id: 'mk-u-c2', description: 'ระบบส่ง email ให้ผู้ใช้ตั้งรหัสผ่านเอง', status: 'match', note: undefined },
        ]),
        m('mk-usr-wrong', 'กำหนดสิทธิ์การเข้าถึงแต่ละโมดูล', 'กำหนด role ได้แต่ยังไม่สามารถตั้ง permission ระดับ feature ได้', 'incorrect', 'กำหนดสิทธิ์ระดับ feature ต่อผู้ใช้แต่ละคน', [
          { id: 'mk-u-c3', description: 'กำหนด role (Admin/Manager/Staff) ได้', status: 'match', note: undefined },
          { id: 'mk-u-c4', description: 'ตั้ง permission ระดับ feature ต่อผู้ใช้แต่ละคน', status: 'wrong', note: 'โค้ดทำ: รองรับแค่ role รวม ยังไม่มี feature-level permission' },
        ]),
        m('mk-usr-pending', 'ล็อก account อัตโนมัติหลัง login ผิด 5 ครั้ง', 'นับจำนวนครั้ง login ผิดและล็อก account ชั่วคราว 30 นาที', 'pending', 'ล็อก account อัตโนมัติเมื่อ login ผิดเกินกำหนด', [
          { id: 'mk-u-c5', description: 'นับจำนวน login ผิดต่อเนื่อง', status: 'missing', note: undefined },
          { id: 'mk-u-c6', description: 'ล็อก account ชั่วคราว 30 นาที หลังผิด 5 ครั้ง', status: 'missing', note: undefined },
        ], true),
        m('mk-usr-noreq', 'ดูประวัติการ login ของผู้ใช้แต่ละคน', 'Log การ login พร้อม IP และ device', 'no-req', null, []),
      ],
    }],
  }
  const mockGroups: SubcategoryGroup[] = MOCK_BY_CAT[cat] ?? []
  const groupsWithMock = [...groups, ...mockGroups]

  return (
    <div className="pt-[48px] px-[32px] pb-24 pr-[320px]">
      <div className="max-w-[1200px] mx-auto flex gap-8 items-start">
        {/* Category side nav */}
        <nav className="w-[200px] max-w-[200px] shrink-0 pt-1">
          <div className="sticky top-12 flex flex-col gap-0.5">
            {allCategories.map(c => (
              <Link
                key={c}
                href={`/projects/${id}/sprint-review/detail?cat=${encodeURIComponent(c)}`}
                className={`text-[14px] px-3 py-2 transition-colors leading-snug ${
                  c === cat
                    ? 'font-semibold text-[var(--text-primary)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                }`}
              >
                {c}
              </Link>
            ))}
          </div>
        </nav>

        {/* Main content */}
        <div className="flex-1 min-w-0 flex flex-col gap-[48px]">
          {/* Header */}
          <div className="flex flex-col gap-3">
            <Link
              href={sprintId ? `/projects/${id}/sprint-review/${sprintId}` : `/projects/${id}/sprint-review`}
              className="flex items-center gap-1.5 text-xs text-[#757575] hover:text-[var(--text-primary)] transition-colors w-fit"
            >
              <CaretLeftIcon size={12} />
              BoltCheck
            </Link>
            <h2 className="font-semibold text-[30px] leading-[45px] text-[var(--text-primary)]">{cat}</h2>
          </div>

          {/* Content */}
          {groups.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">ไม่มีรายการในหมวดนี้</p>
          ) : (
            <SubcategoryList groups={groupsWithMock} hasReq={hasReq} />
          )}
        </div>
      </div>

      <SprintReviewRightPanel
        projectId={id}
        jobId={latestJob?.id ?? ''}
        commitSha={latestJob?.commitSha ?? ''}
        commitMsg={latestJob?.commitMsg ?? ''}
        author={latestJob?.author ?? ''}
        triggeredAt={(latestJob?.triggeredAt ?? new Date()).toISOString()}
        diffResult={diff}
        activeSprint={activeSprint}
        noDiff={!hasPendingDiff}
        mockRequirements={mockRequirements}
      />
    </div>
  )
}
