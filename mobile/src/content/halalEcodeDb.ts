/**
 * E-code reference for in-app halal helper (not fiqh ruling).
 */

export type HalalEcodeEntry = {
  code: string;
  titleKk: string;
  noteKk: string;
  group: "colors" | "preservatives" | "antioxidants" | "thickeners" | "other";
};

const GROUP_ORDER: Record<HalalEcodeEntry["group"], number> = {
  colors: 0,
  preservatives: 1,
  antioxidants: 2,
  thickeners: 3,
  other: 4,
};

export const HALAL_ECODE_ENTRIES: HalalEcodeEntry[] = [
  { code: "E100", titleKk: "Куркумин (сары түс)", noteKk: "Өсімдік шығулы түс бергіш.", group: "colors" },
  { code: "E101", titleKk: "Рибофлавин (B2)", noteKk: "Витамин B2 негізіндегі сары түс.", group: "colors" },
  { code: "E102", titleKk: "Тартразин", noteKk: "Синтетикалық сары бояғыш; сезімталдық болуы мүмкін.", group: "colors" },
  { code: "E110", titleKk: "Сансет йеллоу", noteKk: "Синтетикалық қызғылт-сары бояғыш.", group: "colors" },
  {
    code: "E120",
    titleKk: "Кармин / кошениль",
    noteKk: "Қызыл түс — жәндік шығулы; мәзһабқа байланысты талқылау болуы мүмкін.",
    group: "colors",
  },
  { code: "E122", titleKk: "Азорубин", noteKk: "Синтетикалық қызыл бояғыш.", group: "colors" },
  { code: "E124", titleKk: "Понсо 4R", noteKk: "Синтетикалық қызыл бояғыш.", group: "colors" },
  { code: "E129", titleKk: "Аллюра ред", noteKk: "Синтетикалық қызыл бояғыш.", group: "colors" },
  { code: "E133", titleKk: "Бриллиант көк FCF", noteKk: "Синтетикалық көк бояғыш.", group: "colors" },
  { code: "E140", titleKk: "Хлорофилл", noteKk: "Өсімдік негізді жасыл бояғыш.", group: "colors" },
  { code: "E141", titleKk: "Хлорофиллиндер", noteKk: "Жасыл бояғыш; өсімдік негізі.", group: "colors" },
  { code: "E150a", titleKk: "Карамель I", noteKk: "Карамель бояуы; әдетте халал.", group: "colors" },
  { code: "E150d", titleKk: "Карамель IV", noteKk: "Карамель бояуы; өндіріс көзіне назар.", group: "colors" },
  { code: "E160a", titleKk: "Бета-каротин", noteKk: "Табиғи/синтетикалық қызғылт-сары бояғыш.", group: "colors" },
  { code: "E160c", titleKk: "Паприка экстракты", noteKk: "Өсімдік бояғышы.", group: "colors" },
  { code: "E162", titleKk: "Қызылша бетанині", noteKk: "Қызылша негізіндегі табиғи бояғыш.", group: "colors" },
  { code: "E163", titleKk: "Антоциандар", noteKk: "Жеміс/өсімдік негізді бояғыш.", group: "colors" },
  { code: "E200", titleKk: "Сорбин қышқылы", noteKk: "Консервант; рұқсат концентрацияда.", group: "preservatives" },
  { code: "E202", titleKk: "Калий сорбаты", noteKk: "Кең таралған консервант.", group: "preservatives" },
  { code: "E211", titleKk: "Натрий бензоаты", noteKk: "Сусын, тұздықтарда консервант.", group: "preservatives" },
  { code: "E220", titleKk: "Күкірт диоксиді", noteKk: "Кептірілген жеміс пен шарапта консервант.", group: "preservatives" },
  { code: "E223", titleKk: "Натрий метабисульфиті", noteKk: "Сульфит консервант.", group: "preservatives" },
  { code: "E234", titleKk: "Низин", noteKk: "Ферментациядан алынатын консервант.", group: "preservatives" },
  { code: "E250", titleKk: "Натрий нитриті", noteKk: "Ет өнімдерінде консервант.", group: "preservatives" },
  { code: "E251", titleKk: "Натрий нитраты", noteKk: "Ет өнімдерінде консервант.", group: "preservatives" },
  { code: "E252", titleKk: "Калий нитраты", noteKk: "Ет және ірімшікте консервант.", group: "preservatives" },
  { code: "E260", titleKk: "Сірке қышқылы", noteKk: "Қышқылдық реттегіш және консервант.", group: "preservatives" },
  { code: "E300", titleKk: "Аскорбин қышқылы (С)", noteKk: "Антиоксидант; көбінесе өсімдік синтезі.", group: "antioxidants" },
  { code: "E301", titleKk: "Натрий аскорбаты", noteKk: "Антиоксидант, әсіресе ет өнімдерінде.", group: "antioxidants" },
  { code: "E306", titleKk: "Токоферолдар (E витамині)", noteKk: "Өсімдік майларынан антиоксидант.", group: "antioxidants" },
  { code: "E320", titleKk: "BHA", noteKk: "Майдағы антиоксидант.", group: "antioxidants" },
  { code: "E321", titleKk: "BHT", noteKk: "Майдағы антиоксидант.", group: "antioxidants" },
  {
    code: "E322",
    titleKk: "Лецитин",
    noteKk: "Соя, жұмыртқа немесе күнжүт — аллерген және қайнар маңызды.",
    group: "thickeners",
  },
  { code: "E325", titleKk: "Натрий лактаты", noteKk: "Қышқылдық/ылғал реттегіш; көзі маңызды.", group: "other" },
  { code: "E326", titleKk: "Калий лактаты", noteKk: "Қышқылдық реттегіш, ет өнімдерінде қолданылады.", group: "other" },
  { code: "E327", titleKk: "Кальций лактаты", noteKk: "Минерал және қышқылдық реттегіш.", group: "other" },
  { code: "E330", titleKk: "Лимон қышқылы", noteKk: "Қышқылдық реттегіш.", group: "other" },
  { code: "E331", titleKk: "Натрий цитраттары", noteKk: "Қышқылдық реттегіш/эмульгатор.", group: "other" },
  { code: "E338", titleKk: "Фосфор қышқылы", noteKk: "Кей сусындарда қышқылдық реттегіш.", group: "other" },
  { code: "E339", titleKk: "Натрий фосфаттары", noteKk: "Қышқылдық және құрылым реттегіш.", group: "other" },
  { code: "E407", titleKk: "Каррагинан", noteKk: "Теңіз балдырынан тұрақтандырғыш.", group: "thickeners" },
  { code: "E401", titleKk: "Натрий альгинаты", noteKk: "Балдыр негізді тұрақтандырғыш.", group: "thickeners" },
  { code: "E402", titleKk: "Калий альгинаты", noteKk: "Балдыр негізді тұрақтандырғыш.", group: "thickeners" },
  { code: "E406", titleKk: "Агар", noteKk: "Балдырдан алынатын гельдеуші зат.", group: "thickeners" },
  { code: "E410", titleKk: "Локуст бұршығы", noteKk: "Өсімдік тұрақтандырғышы.", group: "thickeners" },
  { code: "E412", titleKk: "Гуар бұршығы", noteKk: "Өсімдік тұрақтандырғышы.", group: "thickeners" },
  { code: "E414", titleKk: "Арабик шайыры", noteKk: "Акация шайыры — эмульгатор.", group: "thickeners" },
  { code: "E415", titleKk: "Ксантан шайыры", noteKk: "Ферментациялық тұрақтандырғыш.", group: "thickeners" },
  { code: "E416", titleKk: "Карая шайыры", noteKk: "Өсімдік шайыры, тұрақтандырғыш.", group: "thickeners" },
  { code: "E418", titleKk: "Геллан шайыры", noteKk: "Ферментациялық гельдеуші.", group: "thickeners" },
  { code: "E420", titleKk: "Сорбитол", noteKk: "Тәттілendirгіш пен ылғал сақтағыш.", group: "other" },
  {
    code: "E422",
    titleKk: "Глицерин",
    noteKk: "Өсімдік немесе мал шығыны болуы мүмкін — күмәнде өндірушіге сұрақ.",
    group: "other",
  },
  { code: "E432", titleKk: "Полисорбат 20", noteKk: "Эмульгатор; көзі/өндірушіге назар.", group: "thickeners" },
  { code: "E433", titleKk: "Полисорбат 80", noteKk: "Эмульгатор; көзі/өндірушіге назар.", group: "thickeners" },
  { code: "E434", titleKk: "Полисорбат 40", noteKk: "Эмульгатор.", group: "thickeners" },
  { code: "E435", titleKk: "Полисорбат 60", noteKk: "Эмульгатор.", group: "thickeners" },
  { code: "E440", titleKk: "Пектин", noteKk: "Жеміс тұрақтандырғышы; әдетте халал.", group: "thickeners" },
  {
    code: "E441",
    titleKk: "Желатин",
    noteKk: "Көбінесе мал терісі/сүйегі — мәзһаб пен қайнарға байланысты күмәнді; қайнарды раста.",
    group: "other",
  },
  { code: "E450", titleKk: "Полифосфаттар", noteKk: "Ет өнімдерінде ылғал сақтау.", group: "other" },
  {
    code: "E471",
    titleKk: "Май қышқылдарының моно- және диглицеридтері",
    noteKk: "Эмульгатор; өсімдік немесе мал майы — сертификат пен өндірушіге қара.",
    group: "thickeners",
  },
  { code: "E500", titleKk: "Сода (натрий карбонаттары)", noteKk: "Қопсытқыш / pH.", group: "other" },
  { code: "E501", titleKk: "Калий карбонаттары", noteKk: "Қопсытқыш / pH реттегіш.", group: "other" },
  { code: "E503", titleKk: "Аммоний карбонаттары", noteKk: "Қамыр өнімдерінде қопсытқыш.", group: "other" },
  { code: "E551", titleKk: "Кремний диоксиді", noteKk: "Ұйып қалмауға қарсы агент.", group: "other" },
  { code: "E552", titleKk: "Кальций силикаты", noteKk: "Ұйып қалмауға қарсы агент.", group: "other" },
  { code: "E570", titleKk: "Май қышқылдары", noteKk: "Өсімдік/мал көзі болуы мүмкін — қайнарын тексер.", group: "other" },
  { code: "E572", titleKk: "Магний стеараты", noteKk: "Технологиялық қоспа; көзі маңызды.", group: "other" },
  { code: "E621", titleKk: "Глутамат натрий (MSG)", noteKk: "Дәм күшейткіші.", group: "other" },
  { code: "E627", titleKk: "Динатрий гуанилаты", noteKk: "Дәм күшейткіш; жиі E631/E621-пен бірге.", group: "other" },
  { code: "E631", titleKk: "Динатрий инозинаты", noteKk: "Кейде ет/балық көзінен болуы мүмкін, қайнарын тексер.", group: "other" },
  { code: "E635", titleKk: "Натрий рибонуклеотидтері", noteKk: "Дәм күшейткіш қоспа.", group: "other" },
  { code: "E900", titleKk: "Диметилполисилоксан", noteKk: "Көбіктенуге қарсы агент.", group: "other" },
  { code: "E903", titleKk: "Карнауба воғы", noteKk: "Өсімдік воғы — жапсырма жлындығы.", group: "other" },
  { code: "E904", titleKk: "Шеллак", noteKk: "Жәндік шайыры; мәзһабқа байланысты бағаланады.", group: "other" },
  { code: "E905", titleKk: "Парафиндер", noteKk: "Жылтырлатқыш/қаптама агенті.", group: "other" },
  { code: "E950", titleKk: "Ацесульфам-K", noteKk: "Қант алмастырғыш.", group: "other" },
  { code: "E951", titleKk: "Аспартам", noteKk: "Қант алмастырғыш; фенилаланин көзі.", group: "other" },
  { code: "E952", titleKk: "Цикламаттар", noteKk: "Қант алмастырғыш.", group: "other" },
  { code: "E954", titleKk: "Сахарин", noteKk: "Қант алмастырғыш.", group: "other" },
  { code: "E955", titleKk: "Сукралоза", noteKk: "Қант алмастырғыш.", group: "other" },
  { code: "E960", titleKk: "Стевиол гликозидтері", noteKk: "Стевия өсімдігінен тәттілendirгіш.", group: "other" },
  { code: "E965", titleKk: "Мальтитол", noteKk: "Қант спирті.", group: "other" },
  { code: "E967", titleKk: "Ксилит", noteKk: "Қант спирті; тіс пастасы/сағызда жиі.", group: "other" },
  { code: "E132", titleKk: "Индиготин", noteKk: "Синтетикалық көк бояғыш.", group: "colors" },
  { code: "E142", titleKk: "Жасыл S", noteKk: "Синтетикалық жасыл бояғыш.", group: "colors" },
  { code: "E151", titleKk: "Бриллиант қара BN", noteKk: "Синтетикалық қара бояғыш.", group: "colors" },
  { code: "E153", titleKk: "Өсімдік көмірі", noteKk: "Қара түс бергіш (көмір негізі).", group: "colors" },
  { code: "E155", titleKk: "Қоңыр HT", noteKk: "Синтетикалық қоңыр бояғыш.", group: "colors" },
  { code: "E171", titleKk: "Титан диоксиді", noteKk: "Ақ бояғыш; елдерде шектеуі әртүрлі.", group: "colors" },
  { code: "E172", titleKk: "Темір оксидтері", noteKk: "Минерал негізді бояғыштар.", group: "colors" },
  { code: "E210", titleKk: "Бензой қышқылы", noteKk: "Консервант.", group: "preservatives" },
  { code: "E212", titleKk: "Калий бензоаты", noteKk: "Консервант.", group: "preservatives" },
  { code: "E213", titleKk: "Кальций бензоаты", noteKk: "Консервант.", group: "preservatives" },
  { code: "E214", titleKk: "Этил п-гидроксибензоат", noteKk: "Парабен тобы консервант.", group: "preservatives" },
  { code: "E218", titleKk: "Метил п-гидроксибензоат", noteKk: "Парабен тобы консервант.", group: "preservatives" },
  { code: "E219", titleKk: "Натрий метилпарабені", noteKk: "Парабен тобы консервант.", group: "preservatives" },
  { code: "E230", titleKk: "Бифенил", noteKk: "Цитрус қабығында фунгицид ретінде.", group: "preservatives" },
  { code: "E231", titleKk: "Ортофенилфенол", noteKk: "Фунгицид-консервант.", group: "preservatives" },
  { code: "E232", titleKk: "Натрий ортофенилфенолы", noteKk: "Фунгицид-консервант.", group: "preservatives" },
  { code: "E235", titleKk: "Натамицин", noteKk: "Зеңге қарсы консервант.", group: "preservatives" },
  { code: "E236", titleKk: "Құмырсқа қышқылы", noteKk: "Консервант/қышқылдық реттегіш.", group: "preservatives" },
  { code: "E239", titleKk: "Гексаметилентетрамин", noteKk: "Ірімшікте сирек қолданылатын консервант.", group: "preservatives" },
  { code: "E242", titleKk: "Диметил дикарбонат", noteKk: "Сусындарда микробқа қарсы өңдеу.", group: "preservatives" },
  { code: "E249", titleKk: "Калий нитриті", noteKk: "Ет өнімдерінде консервант.", group: "preservatives" },
  { code: "E280", titleKk: "Пропион қышқылы", noteKk: "Нан-тоқашта консервант.", group: "preservatives" },
  { code: "E281", titleKk: "Натрий пропионаты", noteKk: "Нан-тоқашта консервант.", group: "preservatives" },
  { code: "E282", titleKk: "Кальций пропионаты", noteKk: "Нан-тоқашта консервант.", group: "preservatives" },
  { code: "E283", titleKk: "Калий пропионаты", noteKk: "Нан-тоқашта консервант.", group: "preservatives" },
  { code: "E302", titleKk: "Кальций аскорбаты", noteKk: "Антиоксидант.", group: "antioxidants" },
  { code: "E304", titleKk: "Аскорбил пальмитаты", noteKk: "Майлы өнімдерге антиоксидант.", group: "antioxidants" },
  { code: "E307", titleKk: "Альфа-токоферол", noteKk: "Е витамині тобы антиоксидант.", group: "antioxidants" },
  { code: "E308", titleKk: "Гамма-токоферол", noteKk: "Е витамині тобы антиоксидант.", group: "antioxidants" },
  { code: "E309", titleKk: "Дельта-токоферол", noteKk: "Е витамині тобы антиоксидант.", group: "antioxidants" },
  { code: "E310", titleKk: "Пропилгаллат", noteKk: "Антиоксидант.", group: "antioxidants" },
  { code: "E311", titleKk: "Октилгаллат", noteKk: "Антиоксидант.", group: "antioxidants" },
  { code: "E312", titleKk: "Додецилгаллат", noteKk: "Антиоксидант.", group: "antioxidants" },
  { code: "E315", titleKk: "Эриторбин қышқылы", noteKk: "Антиоксидант.", group: "antioxidants" },
  { code: "E316", titleKk: "Натрий эриторбаты", noteKk: "Антиоксидант.", group: "antioxidants" },
  { code: "E319", titleKk: "TBHQ", noteKk: "Май өнімдеріне антиоксидант.", group: "antioxidants" },
  { code: "E385", titleKk: "Кальций-динатрий EDTA", noteKk: "Тотығуды баяулататын кешендеуші.", group: "antioxidants" },
  { code: "E392", titleKk: "Розмарин экстракты", noteKk: "Табиғи антиоксидант.", group: "antioxidants" },
  { code: "E442", titleKk: "Аммоний фосфатидтері", noteKk: "Шоколадта эмульгатор.", group: "thickeners" },
  { code: "E444", titleKk: "Сахароза ацетат изобутират", noteKk: "Сусында тұрақтандырғыш.", group: "thickeners" },
  { code: "E445", titleKk: "Глицерин шайыр эфирлері", noteKk: "Сусында тұрақтандырғыш; глицерин көзі маңызды.", group: "thickeners" },
  { code: "E460", titleKk: "Целлюлоза", noteKk: "Өсімдік талшығы, толтырғыш.", group: "thickeners" },
  { code: "E461", titleKk: "Метилцеллюлоза", noteKk: "Қоюландырғыш.", group: "thickeners" },
  { code: "E462", titleKk: "Этилцеллюлоза", noteKk: "Қоюландырғыш/қаптама агенті.", group: "thickeners" },
  { code: "E463", titleKk: "Гидроксипропилцеллюлоза", noteKk: "Қоюландырғыш.", group: "thickeners" },
  { code: "E464", titleKk: "Гидроксипропилметилцеллюлоза", noteKk: "Қоюландырғыш.", group: "thickeners" },
  { code: "E465", titleKk: "Метилэтилцеллюлоза", noteKk: "Қоюландырғыш.", group: "thickeners" },
  { code: "E466", titleKk: "Карбоксиметилцеллюлоза", noteKk: "Қоюландырғыш.", group: "thickeners" },
  { code: "E469", titleKk: "Ферменттелген целлюлоза", noteKk: "Тұрақтандырғыш.", group: "thickeners" },
  { code: "E470", titleKk: "Май қышқылдары тұздары", noteKk: "Антижабысқақ агент; қайнар май маңызды.", group: "thickeners" },
  { code: "E472e", titleKk: "DATEM", noteKk: "Нан өнімдеріне эмульгатор.", group: "thickeners" },
  { code: "E473", titleKk: "Сахароза эфирлері", noteKk: "Эмульгатор.", group: "thickeners" },
  { code: "E474", titleKk: "Сахароглицеридтер", noteKk: "Эмульгатор; глицерин көзі маңызды.", group: "thickeners" },
  { code: "E475", titleKk: "Полиглицерид эфирлері", noteKk: "Эмульгатор.", group: "thickeners" },
  { code: "E476", titleKk: "PGPR", noteKk: "Шоколадта эмульгатор.", group: "thickeners" },
  { code: "E477", titleKk: "Пропиленгликоль эфирлері", noteKk: "Эмульгатор.", group: "thickeners" },
  { code: "E481", titleKk: "Натрий стеароил-2-лактилат", noteKk: "Эмульгатор; қайнар май маңызды.", group: "thickeners" },
  { code: "E482", titleKk: "Кальций стеароил-2-лактилат", noteKk: "Эмульгатор; қайнар май маңызды.", group: "thickeners" },
  { code: "E491", titleKk: "Сорбитан моностеараты", noteKk: "Эмульгатор; қайнар май маңызды.", group: "thickeners" },
  { code: "E492", titleKk: "Сорбитан тристеараты", noteKk: "Эмульгатор; қайнар май маңызды.", group: "thickeners" },
  { code: "E493", titleKk: "Сорбитан монолаураты", noteKk: "Эмульгатор.", group: "thickeners" },
  { code: "E494", titleKk: "Сорбитан моноолеаты", noteKk: "Эмульгатор.", group: "thickeners" },
  { code: "E495", titleKk: "Сорбитан монопальмитаты", noteKk: "Эмульгатор.", group: "thickeners" },
  { code: "E953", titleKk: "Изомальт", noteKk: "Қант спирті.", group: "other" },
  { code: "E957", titleKk: "Тауматин", noteKk: "Тәтті ақуыз, дәм түзеткіші.", group: "other" },
  { code: "E959", titleKk: "Неогесперидин DC", noteKk: "Тәттілendirгіш/дәм түзеткіші.", group: "other" },
  { code: "E962", titleKk: "Аспартам-ацесульфам тұзы", noteKk: "Қант алмастырғыш.", group: "other" },
  { code: "E968", titleKk: "Эритритол", noteKk: "Қант спирті.", group: "other" },
  { code: "E999", titleKk: "Квиллая сығындысы", noteKk: "Көбік тұрақтандырғыш (сусындарда).", group: "other" },
];

const byNorm = new Map<string, HalalEcodeEntry>();
for (const e of HALAL_ECODE_ENTRIES) {
  byNorm.set(e.code.replace(/\s/g, "").toUpperCase(), e);
}

export function findEcodesInText(text: string): HalalEcodeEntry[] {
  const re = /\bE\s*(\d{3,4}[A-Z]?)\b/gi;
  const seen = new Set<string>();
  const out: HalalEcodeEntry[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const key = `E${m[1]}`.toUpperCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const row = byNorm.get(key);
    if (row) out.push(row);
  }
  return out;
}

export function formatEcodeAppendixForPrompt(entries: HalalEcodeEntry[]): string {
  if (!entries.length) return "";
  const lines = entries.slice(0, 24).map((e) => `— ${e.code}: ${e.titleKk}. ${e.noteKk}`);
  return [
    "=== Қолданба ішіндегі E-код анықтамалары (ақпараттық, фиқһ емес) ===",
    ...lines,
    "Құраммен салыстыр; нақты үкім үшін ұстаз немесе ресми халал ұйымы.",
  ].join("\n");
}

export function halalEcodeEntriesSorted(): HalalEcodeEntry[] {
  return [...HALAL_ECODE_ENTRIES].sort(
    (a, b) => GROUP_ORDER[a.group] - GROUP_ORDER[b.group] || a.code.localeCompare(b.code)
  );
}
