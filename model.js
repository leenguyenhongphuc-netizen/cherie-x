// ChérieX · mô hình hợp nhất 2027 (T1–T12). Đơn vị: đồng. [GĐ] = giả định.
// Dùng chung cho trang studio (trình duyệt) và kiểm tra bằng node.
function cherieModel(p) {
  const M = 12;
  const F = p.factor;                       // hệ số sản lượng (0,75 / 1 / 1,2)
  const sum = a => a.reduce((s, x) => s + x, 0);

  // ---------------- CLOSET ----------------
  const closetOld = p.closet === 'cu';
  const ownTarget = [45, 50, 55, 62, 70, 78, 80, 80, 78, 78, 80, 85];
  const kgRent = [0, 0, 0, 0, 3, 5, 7, 9, 11, 13, 15, 17];
  const turns = [1.6, 2.0, 1.6, 2.0, 2.5, 2.8, 2.9, 2.6, 1.6, 1.3, 1.7, 2.3].map(t => t * F);
  const RENT = 420000, ANC = 59000;
  const LIFE = closetOld ? 9 : 15;
  const OLD_COST = 3679744;
  const NEW_COST = closetOld ? 3679744 : 1300000;
  const careDress = i => (p.care === 'gon' ? (i < 6 ? 45000 : 38000) : (i < 5 ? 45000 : 38000));
  const VAR_OTHER = 47000;
  const closetFixed = i => 6000000 + (i >= 4 ? 7000000 : 0);
  let oldN = 39, newN = 6;
  const C = { rentals: [], rev: [], cost: [], tax: [], dep: [], contrib: [], fixed: [], profit: [], capex: [], retired: [], kho: [] };
  for (let i = 0; i < M; i++) {
    const total = oldN + newN + kgRent[i];
    const r = Math.round(total * turns.at(i));
    const rOld = r * oldN / total, rNew = r * newN / total, rKg = r - rOld - rNew;
    const retOld = Math.min(oldN, rOld / LIFE), retNew = rNew / LIFE;
    oldN -= retOld; newN -= retNew;
    const buy = Math.max(0, ownTarget.at(i) - (oldN + newN));
    newN += buy;
    const rev = r * (RENT + ANC);
    const cost = rKg * RENT * 0.5 + r * careDress(i) + r * VAR_OTHER;
    const tax = rev * 0.10;
    const dep = rOld * OLD_COST / LIFE + rNew * NEW_COST / LIFE;
    const contrib = rev - cost - tax - dep;
    C.rentals.push(r); C.rev.push(rev); C.cost.push(cost); C.tax.push(tax); C.dep.push(dep);
    C.contrib.push(contrib); C.fixed.push(closetFixed(i)); C.profit.push(contrib - closetFixed(i));
    C.capex.push(buy * NEW_COST); C.retired.push(retOld + retNew); C.kho.push(oldN + newN);
  }

  // ---------------- OFFICE ----------------
  const meOnly = p.office === 'me';
  const activeBase = meOnly ? [0, 0, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22] : [0, 0, 6, 10, 14, 18, 22, 26, 30, 33, 36, 40];
  const active = activeBase.map(x => Math.round(x * F));
  const ARPU = meOnly ? 1600000 : 1750000;
  const oCare = meOnly ? 180000 : 240000;
  const oVar = 80000 + 200000 + 35000;
  const oDep = 6600000 / 18;
  const oFixed = i => (i === 0 ? 0 : (meOnly ? 3500000 : 5500000));
  const O = { active: [], rev: [], cost: [], tax: [], dep: [], contrib: [], fixed: [], profit: [], capex: [], unearned: [], deposit: [] };
  let prev = 0;
  for (let i = 0; i < M; i++) {
    const a = active.at(i);
    const rev = a * ARPU, cost = a * (oCare + oVar), tax = rev * 0.10, dep = a * oDep;
    const contrib = rev - cost - tax - dep;
    O.active.push(a); O.rev.push(rev); O.cost.push(cost); O.tax.push(tax); O.dep.push(dep);
    O.contrib.push(contrib); O.fixed.push(oFixed(i)); O.profit.push(contrib - oFixed(i));
    O.capex.push(Math.max(0, a - prev) * 6600000); O.unearned.push(a * ARPU); O.deposit.push(a * 1000000);
    prev = a;
  }

  // ---------------- CARE ----------------
  const lean = p.care === 'gon';
  const carePlan = [37227500, 26812500, 39607500, 48972500, 58677500, 67682500, 75967500, 78482500, 85140000, 95970000, 108800000, 114240000];
  const ext = carePlan.map(x => x * 0.80 * F);
  const officeUnits = active.map(a => a * (meOnly ? 15 : 20));
  const secUnits = [0, 0, 10, 15, 20, 30, 30, 35, 35, 40, 40, 45];
  const g2 = lean ? 6 : 5;                          // tháng có máy riêng (index): gọn = T7, đầy đủ = T6
  const unit = i => (i < g2 ? 24800 : 14300);
  const intRev = [], intCost = [];
  for (let i = 0; i < M; i++) {
    intRev.push(C.rentals.at(i) * careDress(i) + officeUnits.at(i) * 12000 + secUnits.at(i) * 40000);
    intCost.push(C.rentals.at(i) * unit(i) + officeUnits.at(i) * 8000 + secUnits.at(i) * unit(i));
  }
  const equip1 = lean ? 40000000 : 77000000, equip2 = lean ? 24000000 : 35000000;
  const K = { ext: [], int: [], rev: [], cost: [], tax: [], dep: [], contrib: [], fixed: [], profit: [], capex: [], ktv: [] };
  for (let i = 0; i < M; i++) {
    const ktv = i < 4 ? 1 : 2;
    const fixed = ktv * 8500000 + (i < 3 ? 8000000 : 6000000) + 500000;
    const dep = equip1 / 36 + (i >= g2 ? equip2 / 36 : 0);
    const cost = ext.at(i) * 0.31 + intCost.at(i);
    const tax = ext.at(i) * 0.09;
    const rev = ext.at(i) + intRev.at(i);
    const contrib = rev - cost - tax - dep;
    K.ext.push(ext.at(i)); K.int.push(intRev.at(i)); K.rev.push(rev); K.cost.push(cost); K.tax.push(tax);
    K.dep.push(dep); K.contrib.push(contrib); K.fixed.push(fixed); K.profit.push(contrib - fixed);
    K.capex.push(i === g2 ? equip2 : 0); K.ktv.push(ktv);
  }

  // ---------------- SECONDE ----------------
  const dalat = p.seconde === 'dalat';
  const sellRate = [0, 0, .30, .30, .30, .40, .40, .40, .50, .50, .50, .50];
  const REAL = 860000, DRESS_COST = 85000 + 40000 + 20000 + 45000 + 5000 + 0.015 * REAL;
  let kg = [0, 0, 1.4, 2.1, 2.9, 3.5, 3.9, 4.1, 4.5, 5.0, 5.4, 5.0];
  const kgSum = sum(kg); kg = kg.map(x => x * 39803400 * F / kgSum);
  const rtb = [0, 0, 0, 0, 0].concat(Array(7).fill(18513482 * F / 7));
  const dlItems = (dalat ? [0, 0, 0, 20, 30, 40, 50, 60, 70, 80, 100, 110] : Array(12).fill(0)).map(x => x * F);
  const DL_PRICE = 380000, DL_RATE = 0.35, DL_COST = 20000 + 15000 + 8000 + 0.03 * DL_PRICE + 0.07 * DL_RATE * DL_PRICE;
  const sFixedBase = [0, 5000000, 1000000, 1000000, 4000000, 5000000, 5000000, 5000000, 6000000, 6000000, 6000000, 6000000];
  const S = { in: [], sold: [], rev: [], revDress: [], revKg: [], revDl: [], cost: [], contrib: [], fixed: [], profit: [], dlItems: [] };
  let stock = 0;
  for (let i = 0; i < M; i++) {
    let inflow = i >= 2 ? C.retired.at(i) : 0;
    if (i === 2) inflow += C.retired.at(0) + C.retired.at(1);
    stock += inflow;
    const sold = stock * sellRate.at(i); stock -= sold;
    const revDress = sold * REAL + rtb.at(i), revKg = kg.at(i), revDl = dlItems.at(i) * DL_PRICE * DL_RATE;
    const rev = revDress + revKg + revDl;
    const cost = sold * DRESS_COST + revKg * 0.25 + rtb.at(i) * 0.05 + dlItems.at(i) * DL_COST;
    const fixed = sFixedBase.at(i) + (dalat && i >= 5 ? 2000000 : 0);
    S.in.push(inflow); S.sold.push(sold); S.rev.push(rev); S.revDress.push(revDress); S.revKg.push(revKg); S.revDl.push(revDl);
    S.cost.push(cost); S.contrib.push(rev - cost); S.fixed.push(fixed); S.profit.push(rev - cost - fixed); S.dlItems.push(dlItems.at(i));
  }

  // ---------------- KHỐI CHUNG ----------------
  const sharedItems = [
    ['Mặt bằng chung', Array(12).fill(14000000)],
    ['Điện, nước, internet', Array(12).fill(5000000)],
    ['Chủ tiệm', Array(12).fill(10000000)],
    ['Quầy, CSKH', Array(12).fill(7000000)],
    ['Nội dung chung', [3, 3, 3, 3, 6, 6, 6, 6, 6, 6, 6, 6].map(x => x * 1000000)],
    ['Kế toán, phần mềm, dự phòng', Array(12).fill(4000000)],
  ];
  const shared = Array.from({ length: M }, (_, i) => sum(sharedItems.map(s => s[1].at(i))));

  // ---------------- HỢP NHẤT ----------------
  const revExt = Array.from({ length: M }, (_, i) => C.rev.at(i) + O.rev.at(i) + K.ext.at(i) + S.rev.at(i));
  const segProfit = Array.from({ length: M }, (_, i) => C.profit.at(i) + O.profit.at(i) + K.profit.at(i) + S.profit.at(i));
  const net = segProfit.map((x, i) => x - shared.at(i));
  const dep = Array.from({ length: M }, (_, i) => C.dep.at(i) + O.dep.at(i) + K.dep.at(i));
  const capex = Array.from({ length: M }, (_, i) => C.capex.at(i) + O.capex.at(i) + K.capex.at(i));
  const cash = net.map((x, i) => x + dep.at(i) - capex.at(i)
    + (O.unearned.at(i) - (i ? O.unearned.at(i - 1) : 0)) + (O.deposit.at(i) - (i ? O.deposit.at(i - 1) : 0)));
  let c = 0; const cum = cash.map(x => (c += x));
  return { C, O, K, S, shared, sharedItems, revExt, segProfit, net, dep, capex, cash, cum,
    params: { LIFE, NEW_COST, ARPU, equip1, equip2, g2 } };
}
if (typeof module !== 'undefined') module.exports = { cherieModel };
