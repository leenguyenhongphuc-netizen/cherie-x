// ChérieX · mô hình hợp nhất 2027 (T1–T12). Đơn vị: đồng. [GĐ] = giả định.
// Dùng chung cho trang studio (trình duyệt) và kiểm tra bằng node.
// ---------------- KHUNG LƯƠNG (dùng chung cho mô hình và trang) ----------------
// base = lương cơ bản (căn cứ đóng BH, không dưới lương tối thiểu vùng I 2026: 5.310.000đ)
// allow = phụ cấp, phúc lợi trả hằng tháng không tính đóng BH (ăn trưa, xăng, điện thoại)
// bonus = thưởng hoặc hoa hồng bình quân/tháng [GĐ]; contract: 'hdld' (hợp đồng lao động) | 'dv' (hợp đồng dịch vụ, khoán)
const STAFF_ROLES = {
  chu:     { name: 'Chủ tiệm', base: 10000000, allow: 0, bonus: 0, contract: 'chu', note: 'Rút lương chủ; BHXH chủ hộ kinh doanh theo lộ trình luật, chưa tính 2027' },
  quay:    { name: 'Quầy, CSKH', base: 6000000, allow: 980000, bonus: 500000, contract: 'hdld', note: 'Ăn trưa 780k + điện thoại 200k; thưởng khi doanh thu quầy vượt mục tiêu' },
  stylist: { name: 'Stylist Closet', base: 6500000, allow: 1280000, bonus: 1200000, contract: 'hdld', note: 'Ăn trưa 780k + xăng 500k; thưởng 8k mỗi lượt thuê tư vấn' },
  ktv:     { name: 'Kỹ thuật viên Care', base: 6500000, allow: 1080000, bonus: 500000, contract: 'hdld', note: 'Ăn trưa 780k + hóa chất 300k; thưởng khi cả tháng không lỗi phải đền' },
  giao:    { name: 'Giao nhận (khi cố định)', base: 5500000, allow: 1980000, bonus: 500000, contract: 'hdld', note: 'Xăng 1,2 tr + ăn trưa 780k; thưởng 5k/điểm giao vượt 250 điểm' },
  b2b:     { name: 'Sale B2B (bán thời gian)', base: 4000000, allow: 0, bonus: 0, contract: 'hdld-pt', note: 'Lương cứng 4 tr + hoa hồng 10% doanh thu khách doanh nghiệp (tính riêng)' },
};
function staffCost(k, p) {
  const r = STAFF_ROLES[k], full = (p && p.benefits) !== 'luat';
  if (r.contract === 'chu') return r.base;
  const bh = r.base * 0.215, kpcd = r.base * 0.02;
  const t13 = full ? r.base / 12 * (r.contract === 'hdld-pt' ? 0.5 : 1) : 0;
  const perks = full ? (r.contract === 'hdld-pt' ? 100000 : 330000) : 0;
  return r.base + r.allow + r.bonus + bh + kpcd + t13 + perks;
}
function cherieModel(p) {
  const M = 12;
  const F = p.factor;                       // hệ số sản lượng (0,75 / 1 / 1,2)
  const sum = a => a.reduce((s, x) => s + x, 0);

  // ---------------- CLOSET ----------------
  // cu   = mô hình cũ: mua đầm ~3,68 tr, 9 lượt rồi bán lại
  // dx   = mua thông minh: đầm mới ≤ 1,3 tr, 15 lượt
  // hang = 3 hạng: Signature (39 đầm hiện có, thuê 650k, không mua thêm) · Tiệc (≤ 1,3 tr, 420k) · Daily RẬP (~530k giá sỉ, 180k, ~30% kho)
  const mode = p.closet;
  const PU = 1 + (p.priceUp || 0);                       // tăng giá thuê
  const ownTarget = [45, 50, 55, 62, 70, 78, 80, 80, 78, 78, 80, 85];
  const kgRent = [0, 0, 0, 0, 3, 5, 7, 9, 11, 13, 15, 17].map(x => x * (p.kgx || 1));
  const turns = [1.6, 2.0, 1.6, 2.0, 2.5, 2.8, 2.9, 2.6, 1.6, 1.3, 1.7, 2.3].map(t => t * F);
  const careDress = i => (p.care === 'gon' ? (i < 6 ? 45000 : 38000) : (i < 5 ? 45000 : 38000));
  const VAR_OTHER = 47000;
  const closetFixed = i => 6000000 + (i >= 4 ? staffCost('stylist', p) : 0);
  const life = mode === 'cu' ? 9 : 15;
  const pools = [
    { k: 'sig', name: mode === 'hang' ? 'Signature' : 'Đầm hiện có', n: 39, cost: 3679744, rent: mode === 'hang' ? 650000 : 420000, anc: 59000, mult: mode === 'hang' ? 0.6 : 1, life, resale: 860000, replace: mode !== 'hang' },
    { k: 'tiec', name: 'Tiệc', n: 6, cost: mode === 'cu' ? 3679744 : 1300000, rent: 420000, anc: 59000, mult: 1, life, resale: mode === 'cu' ? 860000 : 660000, replace: true },
    { k: 'daily', name: 'Daily RẬP', n: 0, cost: 530000, rent: 180000, anc: 40000, mult: 1.3, life: 15, resale: 150000, replace: true, share: mode === 'hang' ? 0.30 : 0 },
  ];
  const C = { rentals: [], rev: [], cost: [], tax: [], dep: [], contrib: [], fixed: [], profit: [], capex: [], retired: [], retiredValue: [], retiredDaily: [], kho: [], tiers: {} };
  pools.forEach(pl => { C.tiers[pl.k] = { name: pl.name, rentals: [], rev: [], profit: [], kho: [], rent: pl.rent * PU, cost: pl.cost }; });
  for (let i = 0; i < M; i++) {
    let r = 0, rev = 0, cost = 0, dep = 0, ret = 0, retVal = 0, retDaily = 0;
    pools.forEach(pl => {
      const rr = pl.n * pl.mult * turns.at(i);
      const rv = rr * (pl.rent * PU + pl.anc);
      const cs = rr * (careDress(i) + VAR_OTHER), dp = rr * pl.cost / pl.life;
      const rt = Math.min(pl.n, rr / pl.life);
      pl.n -= rt;
      r += rr; rev += rv; cost += cs; dep += dp; ret += pl.k === 'daily' ? 0 : rt; retVal += pl.k === 'daily' ? 0 : rt * pl.resale; retDaily += pl.k === 'daily' ? rt : 0;
      const t = C.tiers[pl.k]; t.rentals.push(rr); t.rev.push(rv); t.profit.push(rv - cs - rv * 0.10 - dp);
    });
    const rKg = kgRent.at(i) * turns.at(i);
    const kgRev = rKg * (420000 * PU + 59000);
    r += rKg; rev += kgRev; cost += rKg * (careDress(i) + VAR_OTHER) + rKg * 420000 * PU * 0.5;
    // mua bù theo kho mục tiêu
    const target = ownTarget.at(i);
    const daily = pools.at(2), tiec = pools.at(1), sig = pools.at(0);
    let capex = 0;
    if (daily.share) { const need = Math.max(0, target * daily.share - daily.n); daily.n += need; capex += need * daily.cost; }
    const have = pools.reduce((s, pl) => s + pl.n, 0);
    const buy = Math.max(0, target - have);
    tiec.n += buy; capex += buy * tiec.cost;
    pools.forEach(pl => C.tiers[pl.k].kho.push(pl.n));
    const tax = rev * 0.10;
    const contrib = rev - cost - tax - dep;
    C.rentals.push(r); C.rev.push(rev); C.cost.push(cost); C.tax.push(tax); C.dep.push(dep);
    C.contrib.push(contrib); C.fixed.push(closetFixed(i)); C.profit.push(contrib - closetFixed(i));
    C.capex.push(capex); C.retired.push(ret); C.retiredValue.push(retVal); C.retiredDaily.push(retDaily);
    C.kho.push(pools.reduce((s, pl) => s + pl.n, 0));
    void sig;
  }

  // ---------------- OFFICE ----------------
  const meOnly = p.office === 'me' || p.office === 'me-rap';
  const KHO = p.office === 'me-rap' ? 4900000 : 6600000;   // vốn tủ đồ mỗi khách; TIATI MOM giá sỉ giảm ~1,7 tr [GĐ]
  const activeBase = meOnly ? [0, 0, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22] : [0, 0, 6, 10, 14, 18, 22, 26, 30, 33, 36, 40];
  const active = activeBase.map(x => Math.round(x * F));
  const ARPU = meOnly ? 1600000 : 1750000;
  const oCare = meOnly ? 180000 : 240000;
  const oVar = 80000 + 200000 + 35000;
  const oDep = KHO / 18;
  const oFixed = i => (i === 0 ? 0 : (meOnly ? 3500000 : 5500000));
  const O = { active: [], rev: [], cost: [], tax: [], dep: [], contrib: [], fixed: [], profit: [], capex: [], unearned: [], deposit: [] };
  let prev = 0;
  for (let i = 0; i < M; i++) {
    const a = active.at(i);
    const rev = a * ARPU, cost = a * (oCare + oVar), tax = rev * 0.10, dep = a * oDep;
    const contrib = rev - cost - tax - dep;
    O.active.push(a); O.rev.push(rev); O.cost.push(cost); O.tax.push(tax); O.dep.push(dep);
    O.contrib.push(contrib); O.fixed.push(oFixed(i)); O.profit.push(contrib - oFixed(i));
    O.capex.push(Math.max(0, a - prev) * KHO); O.unearned.push(a * ARPU); O.deposit.push(a * 1000000);
    prev = a;
  }

  // ---------------- CARE ----------------
  const lean = p.care === 'gon';
  const carePlan = [37227500, 26812500, 39607500, 48972500, 58677500, 67682500, 75967500, 78482500, 85140000, 95970000, 108800000, 114240000];
  const ext = carePlan.map(x => x * 0.80 * F * (1 + (p.careUp || 0)));
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
    const fixed = ktv * staffCost('ktv', p) + (i < 3 ? 8000000 : 6000000) + 500000;
    const dep = equip1 / 36 + (i >= g2 ? equip2 / 36 : 0);
    const b2bComm = (p.careUp || 0) > 0 ? (ext.at(i) - ext.at(i) / (1 + p.careUp)) * 0.10 : 0;   // hoa hồng 10% cho phần khách DN tăng thêm
    const cost = ext.at(i) * 0.31 + intCost.at(i) + b2bComm;
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
  const DRESS_FIX = 85000 + 40000 + 20000 + 45000 + 5000;   // phí sàn, Care, ảnh, ship, hoàn
  const DAILY_PRICE = 150000, DAILY_COST = 20000;            // đầm Daily hết vòng: thanh lý tại tiệm
  let kg = [0, 0, 1.4, 2.1, 2.9, 3.5, 3.9, 4.1, 4.5, 5.0, 5.4, 5.0];
  const kgSum = sum(kg); kg = kg.map(x => x * 39803400 * F / kgSum);
  const rtb = [0, 0, 0, 0, 0].concat(Array(7).fill(18513482 * F / 7));
  const dlItems = (dalat ? [0, 0, 0, 20, 30, 40, 50, 60, 70, 80, 100, 110] : Array(12).fill(0)).map(x => x * F);
  const DL_PRICE = 380000, DL_RATE = 0.35, DL_COST = 20000 + 15000 + 8000 + 0.03 * DL_PRICE + 0.07 * DL_RATE * DL_PRICE;
  const sFixedBase = [0, 5000000, 1000000, 1000000, 4000000, 5000000, 5000000, 5000000, 6000000, 6000000, 6000000, 6000000];
  const S = { in: [], sold: [], rev: [], revDress: [], revKg: [], revDl: [], revDaily: [], cost: [], contrib: [], fixed: [], profit: [], dlItems: [] };
  let stock = 0, stockVal = 0;
  for (let i = 0; i < M; i++) {
    let inflow = i >= 2 ? C.retired.at(i) : 0, inVal = i >= 2 ? C.retiredValue.at(i) : 0;
    if (i === 2) { inflow += C.retired.at(0) + C.retired.at(1); inVal += C.retiredValue.at(0) + C.retiredValue.at(1); }
    stock += inflow; stockVal += inVal;
    const rate = sellRate.at(i), sold = stock * rate, soldVal = stockVal * rate; stock -= sold; stockVal -= soldVal;
    const dailyOut = C.retiredDaily.at(i);
    const revDaily = dailyOut * DAILY_PRICE;
    const revDress = soldVal + rtb.at(i), revKg = kg.at(i), revDl = dlItems.at(i) * DL_PRICE * DL_RATE;
    const rev = revDress + revKg + revDl + revDaily;
    const cost = sold * DRESS_FIX + soldVal * 0.015 + revKg * 0.25 + rtb.at(i) * 0.05 + dlItems.at(i) * DL_COST + dailyOut * DAILY_COST;
    const fixed = sFixedBase.at(i) + (dalat && i >= 5 ? 2000000 : 0);
    S.in.push(inflow); S.sold.push(sold); S.rev.push(rev); S.revDress.push(revDress); S.revKg.push(revKg); S.revDl.push(revDl); S.revDaily.push(revDaily);
    S.cost.push(cost); S.contrib.push(rev - cost); S.fixed.push(fixed); S.profit.push(rev - cost - fixed); S.dlItems.push(dlItems.at(i));
  }

  // ---------------- KHỐI CHUNG ----------------
  const sharedItems = [
    ['Mặt bằng chung', Array(12).fill(14000000 * (p.rentx || 1))],
    ['Điện, nước, internet', Array(12).fill(5000000)],
    ['Chủ tiệm', Array(12).fill(staffCost('chu', p))],
    ['Quầy, CSKH', Array(12).fill(staffCost('quay', p))],
    ['Nội dung chung', [3, 3, 3, 3, 6, 6, 6, 6, 6, 6, 6, 6].map(x => x * 1000000)],
    ['Kế toán, phần mềm, dự phòng', Array(12).fill(4000000)],
    ['Sale B2B, đối tác (lương cứng)', Array.from({ length: 12 }, (_, i) => ((p.careUp || 0) > 0 && i >= 1 ? staffCost('b2b', p) : 0))],
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
    params: { ARPU, KHO, equip1, equip2, g2 } };
}
if (typeof module !== 'undefined') module.exports = { cherieModel, staffCost, STAFF_ROLES };
