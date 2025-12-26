import { ClassRoom } from '../types';

// Helper: Calculate Standard Competition Ranking (1224)
export const getRankMap = (items: { id: string, val: number }[]) => {
  const sorted = [...items].sort((a, b) => b.val - a.val);
  const map = new Map<string, number>();
  
  let currentRank = 1;
  for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i].val < sorted[i-1].val) {
          currentRank = i + 1;
      }
      map.set(sorted[i].id, currentRank);
  }
  return map;
};

export const calculateClassStats = (classes: ClassRoom[]) => {
    if (!classes || !Array.isArray(classes)) {
        return { sortedClasses: [], top3Classes: [], totalInstitutionScore: 0 };
    }

    const sorted = [...classes].sort((a, b) => (b.score || 0) - (a.score || 0));
    const rankMap = getRankMap(classes.map(c => ({ id: c.id, val: c.score || 0 })));
    
    const sortedWithRank = sorted.map(c => ({
      ...c,
      rank: rankMap.get(c.id) || 0
    }));

    return {
        sortedClasses: sortedWithRank,
        top3Classes: sortedWithRank.slice(0, 3),
        totalInstitutionScore: sortedWithRank.reduce((sum, cls) => sum + (cls.score || 0), 0)
    };
};

export const calculateStudentStats = (classes: ClassRoom[]) => {
    if (!classes || !Array.isArray(classes)) {
        return { studentsWithStats: [], top5Students: [], top10Students: [], arenaStudents: [] };
    }

    const allStudents = classes.flatMap(c => 
        (c.students || []).map(s => ({ ...s, className: c.name, classColor: c.color }))
    );
    
    const currentRankMap = getRankMap(allStudents.map(s => ({ id: s.id, val: s.score || 0 })));
    const prevRankMap = getRankMap(allStudents.map(s => ({ id: s.id, val: s.prev_score || 0 })));

    const sortedForDisplay = [...allStudents].sort((a, b) => {
        const scoreDiff = (b.score || 0) - (a.score || 0);
        if (scoreDiff !== 0) return scoreDiff;
        return a.name.localeCompare(b.name, 'he');
    });

    const studentsWithStats = sortedForDisplay.map((s) => {
      const currentRank = currentRankMap.get(s.id) || 999;
      const prevRank = prevRankMap.get(s.id) || 999;
      const rankDiff = prevRank - currentRank;

      return {
        ...s,
        rank: currentRank, 
        rankDiff 
      };
    });

    return {
        studentsWithStats,
        top5Students: studentsWithStats.slice(0, 5),
        top10Students: studentsWithStats.slice(0, 10),
        arenaStudents: studentsWithStats.slice(5)
    };
};
