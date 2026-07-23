import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/firebase/auth-helper';
import { CompetitionRepository, UserService, WalletRepository, XpAccountRepository } from '@el-bannawy/lib';
import { getAdminDb } from '@/lib/firebase/admin';

const competitionRepo = new CompetitionRepository();
const userService = new UserService();
const walletRepo = new WalletRepository();
const xpRepo = new XpAccountRepository();

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(_request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const { id } = await params;

    const competition = await competitionRepo.getById(id);
    if (!competition.ok || !competition.value) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Competition not found' } }, { status: 404 });
    }
    if (competition.value.teacherId !== decoded.uid) {
      const caller = await userService.getUserById(decoded.uid);
      if (!caller.ok || caller.value.role !== 'administrator') {
        return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Not your competition' } }, { status: 403 });
      }
    }
    if (competition.value.status !== 'CLOSED') {
      return NextResponse.json({ success: false, error: { code: 'PRECONDITION_FAILED', message: 'Competition must be CLOSED before finalizing' } }, { status: 412 });
    }

    const participants = await competitionRepo.listParticipants(id);
    if (!participants.ok) {
      return NextResponse.json({ success: false, error: participants.error }, { status: 500 });
    }

    const submitted = participants.value
      .filter((p) => p.status === 'SUBMITTED')
      .sort((a, b) => b.score - a.score);

    const topCount = Math.min(3, submitted.length);
    const top = submitted.slice(0, topCount);

    const xpReward = competition.value.xpReward;
    const coinReward = competition.value.coinReward;

    for (let i = 0; i < top.length; i++) {
      const p = top[i];
      const multiplier = topCount - i;
      const awardXp = Math.round((xpReward * multiplier) / topCount);
      const awardCoins = Math.round((coinReward * multiplier) / topCount);

      const xpAccount = await xpRepo.getByStudentId(p.studentId);
      const currentXp = xpAccount.ok && xpAccount.value ? xpAccount.value.totalXp : 0;
      const currentLevel = xpAccount.ok && xpAccount.value ? xpAccount.value.level : 1;
      await xpRepo.upsert(p.studentId, currentXp + awardXp, currentLevel);

      const wallet = await walletRepo.getByStudentId(p.studentId);
      const bal = wallet.ok && wallet.value ? wallet.value.balance : 0;
      const earned = wallet.ok && wallet.value ? wallet.value.totalEarned : 0;
      await walletRepo.upsert(p.studentId, bal + awardCoins, wallet.ok && wallet.value ? wallet.value.totalPurchased : 0, earned + awardCoins, wallet.ok && wallet.value ? wallet.value.totalSpent : 0, 0);

      await competitionRepo.updateParticipant(p.id, { rank: i + 1 });
    }

    await competitionRepo.update(id, { status: 'FINALIZED' } as any);

    return NextResponse.json({
      success: true,
      data: {
        finalized: true,
        winners: top.map((p, i) => ({ studentId: p.studentId, rank: i + 1, score: p.score })),
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}
