# 2027 tax files: done and still to do

Calendar-year tax years start on 1 January 2027. A file goes live on its start date (tools/tax/registry.js). A US state or Canadian province uses the federal file of its own tax year, so a state only switches to the 2027 federal rules once it has a 2027 file.

The monthly update (2 December, 2 January) works down the to-do list. Make each file from published figures only, with hand-checked tests, and move it to Done. Leave out figures that aren't published yet; a file that has to carry an unconfirmed figure lists it under `provisional`.

## Done

| File | Notes |
|---|---|
| us.2027 | IRS Rev. Proc. 2026-35, SSA wage base $192,300, 401(k) $25,500 |
| us-ak, us-fl, us-nh, us-nv, us-sd, us-tn, us-tx, us-wy | No state income tax on wages |
| us-in.2027 | 2.90% (Indiana DOR). Provisional: county rates from 1 January 2027 (Departmental Notice #1) |
| us-ky.2027 | 3.5%, standard deduction $3,470 (Kentucky DOR). Provisional: no 2027 rate cut enacted |
| us-ms.2027 | 3.75% (H.B. 1, 2025) |
| us-nc.2027 | 3.49% (Session Law 2026-41) |
| us-ia.2027 | 3.8% of federal taxable income (Iowa DOR) |
| us-il.2027 | 4.95% (Illinois DOR). Provisional: personal exemption |
| us-pa.2027 | 3.07% (PA DOR). Provisional: employee UC rate, Philadelphia rate from July 2027 |
| us-oh.2027 | 2.75% above $26,050 (H.B. 96). Provisional: threshold and exemptions if indexing resumes |
| us-mi.2027 | Provisional: 4.25% and $5,900 exemption until Treasury sets 2027 |
| us-ut.2027 | 4.45% (S.B. 60, 2026). Provisional: taxpayer credit phase-out threshold |
| us-az.2027 | 2.5%, federal standard deduction. Provisional: Arizona's 2027 conformity |
| us-ny.2027, us-ny-nyc.2027 | 2027 rate cuts and recapture (S3009C §6, §8 d-6); PFL 0.452% up to $451.81 (DFS). NYC rates carried |
| us-wa.2027 | Paid leave 1.2% × 70.7% employee share; WA Cares 0.58% |

## To do (64)

| File | Name | Where to check | Notes |
|---|---|---|---|
| at | Austria | [source](https://onlinerechner.haude.at/BMF-Brutto-Netto-Rechner/) |  |
| be | Belgium | [source](https://knowledge.plutus.be/belastingen-en-bijdragen/fiscale-kerncijfers/aanslagjaar-2027) |  |
| ca | Canada (federal) | [source](https://www.canada.ca/content/dam/cra-arc/formspubs/pub/t4127-jan/t4127-01-26e.pdf) | CRA T4127 January 2027 edition: indexation, brackets, basic personal amount, CPP/CPP2 and EI 2027 rates and maximums. On 26 November 2026 the CRA had not yet posted 2027 indexation; news reports gave the 2027 CPP YMPE as $76,700 and YAMPE as $87,400 (confirm from the CRA) and the EI rate was not yet confirmed. canada.ca refuses automated requests from some environments: use payroll publications that quote it if so. |
| ca-ab | Alberta | [source](https://www.canada.ca/en/revenue-agency/services/tax/individuals/tax-rates-brackets/current-year.html) |  |
| ca-bc | British Columbia | [source](https://www.canada.ca/en/revenue-agency/services/tax/individuals/tax-rates-brackets/current-year.html) |  |
| ca-mb | Manitoba | [source](https://www.canada.ca/en/revenue-agency/services/tax/individuals/tax-rates-brackets/current-year.html) |  |
| ca-nb | New Brunswick | [source](https://www.canada.ca/en/revenue-agency/services/tax/individuals/tax-rates-brackets/current-year.html) |  |
| ca-nl | Newfoundland and Labrador | [source](https://www.canada.ca/en/revenue-agency/services/tax/individuals/tax-rates-brackets/current-year.html) |  |
| ca-ns | Nova Scotia | [source](https://www.canada.ca/en/revenue-agency/services/tax/individuals/tax-rates-brackets/current-year.html) |  |
| ca-nt | Northwest Territories | [source](https://www.canada.ca/en/revenue-agency/services/tax/individuals/tax-rates-brackets/current-year.html) |  |
| ca-nu | Nunavut | [source](https://www.canada.ca/en/revenue-agency/services/tax/individuals/tax-rates-brackets/current-year.html) |  |
| ca-on | Ontario | [source](https://www.canada.ca/en/revenue-agency/services/tax/individuals/tax-rates-brackets/current-year.html) |  |
| ca-pe | Prince Edward Island | [source](https://www.canada.ca/en/revenue-agency/services/tax/individuals/tax-rates-brackets/current-year.html) |  |
| ca-qc | Quebec | [source](https://www.revenuquebec.ca/documents/en/formulaires/tp/TP-1015.F-V(2026-01).pdf) | Revenu Québec TP-1015.F-V (2027-01), QPP and QPIP 2027 rates. |
| ca-sk | Saskatchewan | [source](https://www.canada.ca/en/revenue-agency/services/tax/individuals/tax-rates-brackets/current-year.html) |  |
| ca-yt | Yukon | [source](https://www.canada.ca/en/revenue-agency/services/tax/individuals/tax-rates-brackets/current-year.html) |  |
| ch | Switzerland (Zurich) | [source](https://swisstaxcalculator.estv.admin.ch/#/home) |  |
| ch-be | Bern | [source](https://swisstaxcalculator.estv.admin.ch/#/home) |  |
| ch-bs | Basel | [source](https://swisstaxcalculator.estv.admin.ch/#/home) |  |
| ch-vd | Lausanne | [source](https://swisstaxcalculator.estv.admin.ch/#/home) |  |
| ch-zg | Zug | [source](https://swisstaxcalculator.estv.admin.ch/#/home) |  |
| de | Germany | [source](https://www.bmf-steuerrechner.de/) | BMF Programmablaufplan 2027 for the wage tax; 2027 social insurance ceilings (Beitragsbemessungsgrenzen). |
| dk | Denmark | [source](https://skat.dk/hjaelp/bundskat-mellemskat-topskat-og-toptopskat) |  |
| es | Spain | [source](https://sede.agenciatributaria.gob.es/Sede/irpf.html) |  |
| fi | Finland | [source](https://vero.fi/syventavat-vero-ohjeet/ohje-hakusivu/49038/verotettavan-tulon-laskeminen-henkiloverotuksessa9/) |  |
| fr | France | [source](https://simulateur-ir-ifi.impots.gouv.fr/calcul_impot/2026/) |  |
| ie | Ireland | [source](https://www.revenue.ie/en/personal-tax-credits-reliefs-and-exemptions/tax-relief-charts/index.aspx) |  |
| it | Italy | [source](https://infoprecompilata.agenziaentrate.gov.it/portale/web/guest/quadro-c-lavoro-dipendente) |  |
| jp | Japan | [source](https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/2260.htm) | Check the NTA for 2027 changes (basic deduction, employment income deduction). |
| lu | Luxembourg | [source](https://impotsdirects.public.lu/fr/baremes.html) |  |
| nl | Netherlands | [source](https://www.belastingdienst.nl/wps/wcm/connect/nl/voorlopige-aanslag/content/voorlopige-aanslag-tarieven-en-heffingskortingen) |  |
| no | Norway | [source](https://www.skatteetaten.no/en/rettskilder/type/uttalelser/uttalelser/forskuddsutskrivingen-2026/) |  |
| pt | Portugal | [source](https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/codigos_tributarios/cirs_rep/Pages/irs68.aspx) |  |
| se | Sweden | [source](https://app.skatteverket.se/rakna-skatt-client-skut-skatteutrakning/) |  |
| us-al | Alabama | [source](https://www.revenue.alabama.gov/wp-content/uploads/2026/01/25f40bk.pdf#page=9) |  |
| us-ar | Arkansas | [source](https://arkleg.state.ar.us/Bills/Detail?id=hb1001&ddBienniumSession=2025%2F2026S1) |  |
| us-ca | California | [source](https://www.ftb.ca.gov/forms/2025/2025-540-p.pdf#page=1) | Brackets and the SDI rate change each year: FTB 2027 rate schedules or withholding tables, and EDD's 2027 SDI rate. |
| us-co | Colorado | [source](https://tax.colorado.gov/sites/tax/files/documents/Book104_2025.pdf#page=11) | FAMLI 2027 rate; the income tax rate can change under TABOR. The state's site blocks automated requests: ask the owner to read it. |
| us-ct | Connecticut | [source](https://portal.ct.gov/-/media/drs/forms/2025/income/2025-ct-1040-instructions_1225.pdf#page=23) |  |
| us-dc | District of Columbia | [source](https://otr.cfo.dc.gov/sites/default/files/dc/sites/otr/publication/attachments/2025_D40_Book_082026_v1.pdf#page=20) |  |
| us-de | Delaware | [source](https://revenuefiles.delaware.gov/2025/PITForms_Instructions/Instructions/PIT-RES_Instructions_2025-01.pdf#page=8) |  |
| us-ga | Georgia | [source](https://www.legis.ga.gov/api/legislation/document/20252026/249080#page=3) | HB 463 (2026) cuts the rate by 0.125 a year from 2027 (to 4.865%) and raises the standard deduction by $375 / $750 (to $15,375 / $30,750), each delayed a year if the Office of Planning and Budget reports by 1 December that a revenue condition is not met. Read that report or the Georgia DOR 2027 withholding tables. |
| us-hi | Hawaii | [source](https://data.capitol.hawaii.gov/sessions/session2026/bills/SB3125_CD1_.HTM) |  |
| us-id | Idaho | [source](https://tax.idaho.gov/wp-content/uploads/forms/EIN00046/EIN00046_03-02-2026.pdf#page=4) |  |
| us-ks | Kansas | [source](https://www.ksrevenue.gov/pdf/ip25.pdf#page=2) |  |
| us-la | Louisiana | [source](https://www.bls.gov/news.release/archives/cpi_01132026.htm) |  |
| us-ma | Massachusetts | [source](https://www.mass.gov/doc/2025-form-1-instructions/download#page=3) | PFML 2027 contribution rate; the 4% surtax threshold is indexed. The state's site blocks automated requests: ask the owner to read it. |
| us-md | Maryland | [source](https://www.marylandcomptroller.gov/content/dam/mdcomp/tax/instructions/2025/resident-booklet.pdf#page=22) |  |
| us-me | Maine | [source](https://www.irs.gov/pub/irs-drop/rp-25-32.pdf#page=18) | Brackets are indexed; PFML 2027. The state's site blocks automated requests: ask the owner to read it. |
| us-mn | Minnesota | [source](https://www.revenue.state.mn.us/sites/default/files/2026-07/m1mt-25.pdf#page=1) |  |
| us-mo | Missouri | [source](https://dor.mo.gov/forms/MO-1040ES_2026.pdf#page=2) |  |
| us-mt | Montana | [source](https://revenue.mt.gov/taxes/tax-tables-and-deductions/2025) |  |
| us-nd | North Dakota | [source](https://www.tax.nd.gov/sites/www/files/documents/forms/individual/2025-iit/28709-form-nd-1es-2026.pdf#page=2) |  |
| us-ne | Nebraska | [source](https://revenue.nebraska.gov/sites/default/files/doc/tax-forms/2025/f_1040N-ES.pdf#page=5) |  |
| us-nj | New Jersey | [source](https://www.nj.gov/treasury/taxation/pdf/current/1040i.pdf#page=8) | TDI/FLI and UI/WF 2027 rates and wage bases (NJ Department of Labor). |
| us-nm | New Mexico | [source](https://klvg4oyd4j.execute-api.us-west-2.amazonaws.com/prod/PublicFiles/34821a9573ca43e7b06dfad20f5183fd/0558a902-6362-47ca-8e3b-7cca3bc69b9d/2025%20PIT%20Packet_Final.pdf#page=49) |  |
| us-ok | Oklahoma | [source](https://oklahoma.gov/content/dam/ok/en/tax/documents/forms/individuals/current/511-Pkt.pdf#page=10) |  |
| us-or | Oregon | [source](https://www.oregon.gov/dor/forms/FormsPubs/publication-or-estimate_101-026_2026.pdf#page=3) |  |
| us-ri | Rhode Island | [source](https://tax.ri.gov/sites/g/files/xkgbur541/files/2025-11/ADV_2025_22_Inflation_Adjustments.pdf#page=1) |  |
| us-sc | South Carolina | [source](https://www.scstatehouse.gov/sess126_2025-2026/bills/4216) |  |
| us-va | Virginia | [source](https://budget.lis.virginia.gov/amendment/2026/2/HB30/Introduced/CR/4-14/1c) |  |
| us-vt | Vermont | [source](https://legislature.vermont.gov/Documents/2026/Docs/ACTS/ACT169/ACT169%20As%20Enacted.pdf#page=9) |  |
| us-wi | Wisconsin | [source](https://www.revenue.wi.gov/TaxForms2026/2026-Form1-ES-Inst.pdf#page=2) |  |
| us-wv | West Virginia | [source](https://www.wvlegislature.gov/Bill_Text_HTML/2026_SESSIONS/RS/bills/sb392%20sub1%20enr.pdf#page=6) |  |
