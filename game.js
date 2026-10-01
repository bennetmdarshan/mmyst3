'use strict';
const $=id=>document.getElementById(id);
const canvas=$('world'), ctx=canvas.getContext('2d'), modal=$('dialog');
const W=1440,H=810;
const phoneLayout=window.matchMedia('(max-width: 900px) and (pointer: coarse), (max-width: 750px)');
const bookModal=$('book-dialog'), casebook=$('casebook'), bookHome=casebook.parentElement;
function closeBook(){if(bookModal.open)bookModal.close();bookHome.append(casebook);keys={};}
function paused(){return modal.open||bookModal.open;}
const scenes={baker:{name:'221B Baker Street',sub:'A letter. A visitor. A matter of discretion.'},street:{name:'Serpentine Avenue',sub:'Briony Lodge, St. John’s Wood'},church:{name:'The Church of St. Monica',sub:'An unexpected appointment at the altar.'},lodge:{name:'Inside Briony Lodge',sub:'The smallest gesture may reveal everything.'}};
const assetNames=['baker','street','church','lodge','holmes','watson','king','groom','irene','norton'];
const images={};let assetsLoaded=0, assetErrors=[];
assetNames.forEach(name=>{let im=new Image();im.onload=()=>assetsLoaded++;im.onerror=()=>{assetErrors.push(name);toast('An illustration could not load. Refresh to retry.');};im.src='assets/'+name+'.webp';images[name]=im;});
let scene='baker', act=0, flags={}, clues=[], tab='evidence', target=null, pending=null, keys={}, moving=false, facing=1, showLabels=true, last=0, smoke=0;
let player={x:690,y:680};
const clueData={letter:['The pink notepaper','Unsigned, expensive paper. Its unusual sentence order suggests a German-speaking writer. The sender intends to wear a mask.'],watermark:['A Bohemian watermark','Eg · P · Gt. The Continental Gazetteer identifies Egria in Bohemia as a paper-making town.'],identity:['A king behind the mask','The visitor admits he is the King of Bohemia. His account is a client’s claim, not yet an independent finding.'],photo:['The cabinet photograph','The King and Irene Adler appear together in a large photograph. Five attempts to recover it have failed.'],address:['Irene Adler of Briony Lodge','A former opera singer, now living on Serpentine Avenue. The King fears the photograph will disrupt his impending marriage.'],routine:['A familiar visitor','The groom identifies Godfrey Norton, a lawyer who visits regularly. Irene takes a carriage out at five, returning at seven.'],windows:['The sitting-room windows','Long windows face the street. A person outside could see a signal from within.'],destination:['A hurried carriage','Norton and Irene both call for carriages to the Church of St. Monica. Their relationship needs investigation.'],marriage:['Witness to a marriage','Holmes witnesses Irene Adler marry Godfrey Norton. The King’s version of her intentions may be mistaken.'],sovereign:['A sovereign for the witness','Irene gives the disguised Holmes a sovereign after the ceremony. An unexpected souvenir.'],plan:['A question of instinct','A false alarm could make Irene check the object she most wants to protect. Observe her actions instead of repeating the failed searches.'],hiding:['The sliding panel','When smoke enters the room, Irene checks the recess above the right bell-pull, half drawing out the photograph.'],greeting:['A familiar voice','A passing youth knows Holmes by name. Has someone seen through the disguise?'],farewell:['Irene’s letter','She recognized the trick, followed Holmes in disguise, and left England with her husband. She keeps the photograph for protection and promises not to harm the King.'],portrait:['A portrait left behind','The photograph in the recess now depicts Irene alone. The King’s photograph has gone with her.']};
function has(id){return !!flags[id];}
function add(id){if(!clues.includes(id)){clues.push(id);toast('Evidence recorded · '+clueData[id][0]);}renderUI();}
function toast(message){$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').classList.remove('visible'),3400);}
function note(text){$('narrative-text').textContent=text;}
function closeDialog(){modal.close();keys={};canvas.focus({preventScroll:true});}
function say(title,text,choices=[],portrait=null,kind='CONVERSATION'){
 closeBook();keys={};target=null;pending=null;moving=false;
 $('dialog-title').textContent=title;$('dialog-text').textContent=text;$('dialog-kind').textContent=kind;
 const p=$('portrait');p.style.display=portrait?'block':'none';if(portrait){p.style.backgroundImage=`url(assets/${portrait}.webp)`;p.style.backgroundSize='contain';p.style.backgroundPosition='center top';}
 $('choices').replaceChildren();
 (choices.length?choices:[['Continue',closeDialog]]).forEach(([label,action],i)=>{const b=document.createElement('button');b.textContent=label;if(choices.length===1)b.className='primary';b.onclick=()=>{closeDialog();action();renderUI();};$('choices').append(b);});
 if(!modal.open)modal.showModal();
}
function observe(id,title,text){add(id);say(title||clueData[id][0],text||clueData[id][1],[],null,'OBSERVATION');}
function completeAct(n){act=Math.max(act,n);renderUI();}
function go(where){if(!unlocked(where)){toast('Follow the current lead to unlock this location.');return;}closeBook();scene=where;player={x:620,y:710};target=null;pending=null;renderUI();canvas.focus({preventScroll:true});}
function unlocked(where){return where==='baker'||where==='street'&&has('briefed')||where==='church'&&has('destination')||where==='lodge'&&has('entered');}
function outfit(){return has('entered')&&!has('morning')?'norton':has('disguised')&&!has('plan')?'groom':'holmes';}
function spots(){
 if(scene==='baker')return [
 {id:'letter',label:'Inspect letter',x:255,y:605,sy:50,action:()=>observe('letter','The unsigned letter','Heavy pink paper, an expensive choice. The writer asks for secrecy and warns that he will wear a mask. His sentence order is unusual for English.\nHold the paper to the light: Eg · P · Gt. The bookcase may help identify those marks.')},
 {id:'book',label:'Search gazetteer',x:440,y:596,sy:37,action:()=>{if(!clues.includes('letter'))say('The Continental Gazetteer','A useful reference, but what are we looking for? First examine the letter on the desk.');else observe('watermark','Egria, Bohemia','Eg identifies Egria, a Bohemian town known for paper mills. P abbreviates Papier; Gt abbreviates Gesellschaft. Together with the writer’s phrasing, it is a promising lead.\nOpen “Make a deduction” in the casebook.');}},
 {id:'watson',label:'Talk to Watson',x:885,y:645,sy:51,npc:'watson',action:watson},
 ...(!has('briefed')?[{id:'king',label:has('identity')?'Interview the King':'The masked visitor',x:1180,y:650,sy:48,npc:'king',action:king}]:[]),
 ...(has('briefed')&&!has('disguised')?[{id:'wardrobe',label:'Put on a disguise',x:1200,y:615,sy:37,action:()=>{flags.disguised=true;say('An out-of-work groom','A change of clothes, posture and voice. The men at the mews are more likely to confide in a fellow groom than a consulting detective.',[['Travel to Briony Lodge',()=>go('street')]],'groom','ACTION');renderUI();}}]:[])
 ];
 if(scene==='street')return [
 {id:'groom',label:'Interview the groom',x:285,y:650,sy:50,npc:'groom',action:groom},
 {id:'windows',label:'Inspect windows',x:865,y:617,sy:35,action:()=>observe('windows')},
 ...(has('routine')&&!has('marriage')?[{id:'carriage',label:'Follow the carriages',x:1210,y:682,sy:60,action:()=>{flags.destination=true;add('destination');say('Two carriages. One destination.','Norton leaves in a hurry. Moments later Irene follows. Both instruct their drivers to make for the Church of St. Monica.',[['Follow them to the church',()=>go('church')],['Keep investigating',closeDialog]],null,'A NEW LEAD');}}]:[]),
 ...(has('plan')&&!has('entered')?[{id:'door',label:'Perform the staged rescue',x:940,y:630,sy:48,action:enterLodge}]:[]),
 ...(has('morning')?[{id:'return',label:'Enter Briony Lodge',x:940,y:630,sy:48,action:()=>go('lodge')}]:[])
 ];
 if(scene==='church')return [
 {id:'norton',label:'Speak to Norton',x:870,y:614,sy:44,npc:'norton',action:norton},
 {id:'irene',label:'Speak to Irene',x:1040,y:627,sy:47,npc:'irene',action:irene},
 {id:'register',label:'Examine the register',x:480,y:615,sy:46,action:()=>{if(!has('marriage'))say('The marriage register','The clergyman is waiting for a witness. Speak to the anxious gentleman by the altar.');else observe('marriage');}}
 ];
 return [
 ...(!has('morning')?[{id:'irene',label:'Speak to Irene',x:1040,y:648,sy:47,npc:'irene',action:()=>say('Irene Adler','Please rest a moment. You were very brave to help me. May I fetch you something?',[[has('window')?'Thank her':'Ask for some air',()=>{flags.window=true;say('The window opens','Irene asks for the window to be opened. Watson is waiting outside. You now have a clear line of sight.',[],null,'ACTION');}]],'irene')},
 {id:'window',label:has('window')?'Signal Watson':'Open the window',x:300,y:624,sy:36,action:signal}]:[]),
 {id:'panel',label:has('morning')?'Search the recess':'Examine the bell-pull',x:1040,y:625,sy:27,action:panel},
 ...(has('hiding')&&!has('morning')?[{id:'leave',label:'Return with the King',x:1200,y:690,sy:61,action:morning}]:[]),
 ...(has('morning')?[{id:'king',label:'Speak to the King',x:370,y:671,sy:52,npc:'king',action:()=>{if(has('farewell'))ending();else say('The King of Bohemia','She has gone? Then we must look where you saw her conceal the photograph.',[],'king');}},{id:'watson',label:'Talk to Watson',x:640,y:682,sy:54,npc:'watson',action:watson}]:[])
 ];
}
function king(){
 if(!has('identity')){say('Count von Kramm','I represent a person of the highest importance. This matter requires absolute secrecy. You will excuse the mask.',[['Ask about his identity',()=>say('A carefully chosen disguise','He claims to be a Bohemian nobleman. His costly cloak, confident manner and insistence on secrecy suggest someone of greater standing. What do the letter and its watermark tell you?',[[clues.includes('letter')&&clues.includes('watermark')?'Make a deduction':'Examine the letter',()=>{if(clues.includes('letter')&&clues.includes('watermark'))deduce();}]],'king')],['Leave the conversation',closeDialog]],'king');return;}
 const options=[];
 if(!has('photo'))options.push(['What exactly must be recovered?',()=>{flags.photo=true;add('photo');say('The cabinet photograph','The letters could be dismissed as forgeries. But the photograph shows us together. Five attempts to recover it have failed: searches of her house, her luggage and her person.',[['Ask another question',king]],'king');}]);
 if(!has('address'))options.push(['Who is Irene Adler?',()=>{flags.address=true;add('address');say('Irene Adler','A former opera singer. She lives at Briony Lodge, Serpentine Avenue. I fear she will send the photograph to my future bride’s family when our betrothal is announced.\nWe have three days. That is my account of the danger, Mr. Holmes.',[['Ask another question',king]],'king');}]);
 if(has('photo')&&has('address'))options.push(['Accept the case',()=>{flags.briefed=true;completeAct(1);note('The King wants a photograph recovered. But a client’s fears are not the whole truth. First, learn Irene Adler’s habits. A groom’s disguise should open a few doors.');say('The investigation begins','Briony Lodge is now on your list of locations. Before questioning the men at the mews, put on a groom’s disguise at the wardrobe.',[['Begin investigating',closeDialog]],'holmes','CASE ACCEPTED');}]);
 options.push(['Leave the conversation',closeDialog]);say('The King of Bohemia','You have seen through my disguise. Now you must help me prevent a scandal.',options,'king');
}
function groom(){
 if(!has('disguised')){say('The groom','A gentleman asking questions about Miss Adler? I have horses to attend to.',[['Return to Baker Street for a disguise',()=>go('baker')],['Leave',closeDialog]],'groom');return;}
 say('The groom','You look like a fellow who knows horses. Lend a hand and I’ll tell you what I know.',[
 ['Help with the horses and ask about visitors',()=>{flags.routine=true;add('routine');say('A gentleman from the Inner Temple','Godfrey Norton, a lawyer. Calls every day, sometimes twice. Miss Adler drives out at five and is back by seven.\nLook—there he goes now. He seems in quite a hurry.',[['Watch the carriages',()=>{renderUI();note('Norton’s frequent visits could mean business—or something more. Follow the carriages to establish the connection.');}]],'groom');}],
 ['Ask about the house',()=>observe('windows','The lodge','The groom describes a large sitting room facing the street. Its long windows offer a view from outside. The front door has a sturdy lock; direct entry would attract attention.')],['Leave',closeDialog]],'groom');
}
function norton(){if(has('marriage')){say('Godfrey Norton','You have our gratitude. I must return to the Temple; my wife will go home.',[['Return to Baker Street',()=>go('baker')],['Leave',closeDialog]],'norton');return;}
 say('Godfrey Norton','You there! We need a witness, and time is running out. Will you stand with us?',[
 ['Act as witness to the marriage',()=>{flags.marriage=true;add('marriage');completeAct(2);note('Irene Adler and Godfrey Norton are married. This changes the meaning of the King’s story. Speak to Irene, then return to Baker Street and plan with Watson.');say('An unexpected witness','Before you can gather your thoughts, the ceremony is complete. Irene Adler is now Irene Norton.\nA genuine marriage—not merely a lawyer looking after a client’s affairs.',[['Speak to Irene',irene],['Return to Baker Street',()=>go('baker')]],'holmes','ACTION COMPLETE');}],
 ['Observe first',()=>say('The waiting couple','Norton’s anxiety appears personal, not professional. The clergyman needs a witness before the ceremony can proceed.',[['Offer to act as witness',norton]])]],'norton');}
function irene(){if(!has('marriage')){say('Irene Adler','Please, speak with Mr. Norton. We cannot proceed without a witness.',[],'irene');return;}
 if(!clues.includes('sovereign')){add('sovereign');}say('Irene Norton, née Adler','Thank you for helping us. Please take this sovereign as a small remembrance of the day.\nI shall go home now; my drive in the park will be at five, as usual.',[['Return to Baker Street',()=>go('baker')],['Leave',closeDialog]],'irene');}
function watson(){
 if(has('farewell')){ending();return;}
 if(has('marriage')&&!has('plan')){say('Dr. Watson','Married! Then our client may have misunderstood her intentions. But where is the photograph, and how shall we find it?',[
 ['Reason from the evidence',deduce],['Review what we know',()=>{tab='evidence';renderUI();}],['Leave',closeDialog]],'watson');return;}
 if(has('plan')){say('Dr. Watson',has('hiding')?'You found the hiding place. But that familiar voice in the street troubles me. Return to the lodge with the King in the morning.':'I shall wait outside the sitting-room window. Once you have gained entry, ask for air, then raise your hand. I will provide the false alarm.',[['Continue investigating',closeDialog]],'watson');return;}
 say('Dr. Watson','The smallest details often prove the most useful. I can help you review the next step.',[['What should I investigate?',hint],['Leave',closeDialog]],'watson');
}
function deduce(){
 if(!has('identity')){
 if(!clues.includes('letter')||!clues.includes('watermark')){say('Not enough evidence','Inspect both the pink letter and the Continental Gazetteer before identifying the visitor.',[],null,'DEDUCTION');return;}
 say('Who is behind the mask?','A German-speaking writer. Paper made in Bohemia. An expensive disguise and a matter affecting a royal house. Which explanation best fits?',[
 ['A paper merchant from Egria',()=>wrong('The paper tells us where it was made, not the writer’s profession. Account for the secrecy and royal connection as well.')],
 ['The King of Bohemia, travelling incognito',()=>{flags.identity=true;add('identity');say('The mask falls','The visitor admits you are correct. His own future marriage is at stake. You may now question him directly.',[['Interview the King',king]],'king','DEDUCTION CONFIRMED');}],
 ['An English actor seeking publicity',()=>wrong('The letter’s wording and watermark point elsewhere. Publicity also conflicts with his insistence on secrecy.')]],null,'DEDUCTION · 01');return;}
 if(!has('marriage')){say('Follow the evidence','The client’s identity is established. Investigate Irene’s visitors and discover where the hurried carriages are going.',[],null,'DEDUCTION');return;}
 if(!has('plan')){
 if(!clues.includes('photo')||!clues.includes('windows')){say('A missing observation','We need the King’s account of the photograph and a closer look at the lodge’s windows before we can plan.',[],null,'DEDUCTION');return;}
 say('How can we locate the photograph?','The searches have failed. Irene is newly married, and the photograph remains valuable to her. The windows give Watson a view of the sitting room.',[
 ['Repeat the burglary after dark',()=>wrong('Two house searches have already failed. We need a way to reveal the hiding place, not another blind search.')],
 ['Create a false alarm and watch what she protects',()=>{flags.plan=true;add('plan');completeAct(3);note('Back at Baker Street, Holmes changes into a clergyman’s disguise. A staged street disturbance will gain him entry. Watson will wait outside the window with the smoke rocket.');say('A carefully staged deception','Disguised as a clergyman, you will appear to rescue Irene during a staged scuffle. She will bring the apparently injured stranger inside.\nAsk for air. Signal Watson. Watch what Irene protects during the false alarm.',[['Go to Briony Lodge',()=>go('street')]],'watson','PLAN AGREED');}],
 ['Assume Norton carries it everywhere',()=>wrong('Norton’s marriage to Irene does not establish that he has the photograph. That would be an assumption without an observation.')]],null,'DEDUCTION · 02');return;}
 if(!has('farewell')){say('Test the theory',has('hiding')?'You saw Irene open the recess. Return the next morning and examine it.':'Carry out the plan at Briony Lodge. Your next deduction must come from what you observe.',[],null,'DEDUCTION');return;}
 say('Why did Irene keep the photograph?','She has married Norton, left England, and written that the King need not fear exposure. What explains her decision to keep it?',[
 ['She still hopes to marry the King',()=>wrong('Her marriage, departure and letter contradict that explanation.')],
 ['Protection against the King’s future interference',()=>{flags.solved=true;completeAct(5);ending();}],
 ['She plans to sell it to the newspapers',()=>wrong('There is no evidence of a sale. Her letter gives a different reason.')]],null,'DEDUCTION · 03');
}
function wrong(text){say('Reconsider the evidence',text,[['Try another deduction',deduce],['Return to the case',closeDialog]],'holmes','A THEORY, NOT A FACT');}
function enterLodge(){flags.entered=true;go('lodge');note('The staged scuffle succeeds. Irene has the injured clergyman carried inside. Her kindness makes the deception uncomfortable, even for Watson.');say('Inside Briony Lodge','A little red paint and a convincing fall have gained you entry. Irene offers assistance. Ask for air so Watson can see your signal.',[['Look around the sitting room',closeDialog]],'holmes','ACTION');}
function signal(){if(!has('window')){flags.window=true;say('A breath of air','The window is opened at your request. Watson is now in position outside. Signal him when you are ready.',[],null,'ACTION');return;}if(has('hiding')){say('The false alarm is over','There is no need to repeat the trick. The coachman is watching you. Leave and return in the morning.');return;}
 smoke=1;flags.hiding=true;add('hiding');completeAct(4);note('At Holmes’s signal, Watson raises the false alarm. Irene moves straight to the panel above the right bell-pull. The secret is revealed—but has the trick revealed something to her, too?');
 say('Observe Irene’s reaction','Smoke curls through the window. Irene hurries to the right bell-pull and opens a sliding panel above it. You glimpse the photograph.\nYou call out that it is a false alarm. She replaces the photograph, then studies the smoke rocket.',[['Examine the hiding place',()=>{smoke=0;panel();}],['Leave before arousing more suspicion',()=>{smoke=0;morning();}]],'irene','CRITICAL OBSERVATION');}
function panel(){if(!has('hiding')){say('The bell-pull','A perfectly ordinary fitting at first glance. Searching openly would expose the disguise. Try the plan you agreed with Watson.');return;}if(!has('morning')){say('The hidden recess','The photograph is behind the panel, but the coachman is watching. Holmes decides to leave it in place and return with the King in the morning.',[['Leave and return with the King',morning],['Keep looking around',closeDialog]],null,'OBSERVATION');return;}
 flags.farewell=true;add('farewell');add('portrait');note('The recess holds a portrait of Irene alone and a letter addressed to Holmes. She has left England with Norton. The case was never quite what the King believed it to be.');
 say('A letter for Sherlock Holmes','Irene explains that the smoke trick made her suspicious. Disguised as a young man, she followed you to Baker Street and confirmed your identity.\nShe and Norton have left England. She will not interfere with the King’s marriage; she retains the photograph only to protect herself from him. In its place she leaves a portrait of herself.',[['Make the final deduction',deduce],['Review the evidence',closeDialog]],'irene','IRENE’S LETTER · ADAPTED');}
function morning(){flags.morning=true;smoke=0;add('greeting');go('lodge');note('On the way home a passing youth greeted Holmes by name. By morning, Irene and Norton have left on the 5:15 train. You arrive with the King to find the lodge empty. Examine the recess.');say('The following morning','A servant reports that Irene and her husband have left for the Continent. The lady expected your visit.\nThe hiding place remains. What has she left behind?', [['Search the room',closeDialog]],'watson','ACT V · THE WOMAN');}
function ending(){if(!has('solved')){deduce();return;}
 say('The woman who outwitted Holmes','The King accepts Irene’s promise. Holmes has found the truth, but Irene has defeated his plan. He asks for her portrait as his reward.\nYou have completed A Scandal in Bohemia. The ending follows Conan Doyle’s original story: understanding the case does not mean winning it.\n'+clues.length+' observations recorded · 3 deductions resolved',[['Return to the completed case',closeDialog],['Read the original story',()=>window.open('https://sherlock-holm.es/stories/pdf/letter/1-sided/advs.pdf#page=9','_blank','noopener')],['Start a new investigation',restartPrompt]],'holmes','CASE CLOSED');}
function objectives(){
 if(has('solved'))return ['Case closed','Irene’s portrait remains. You may review your evidence or begin again.'];
 if(has('farewell'))return ['Understand Irene’s motive','Make the final deduction from her letter and marriage.'];
 if(has('morning'))return ['Search the hidden recess','Examine the panel above the right bell-pull.'];
 if(has('hiding'))return ['Return with the King','Leave the lodge and return the following morning.'];
 if(has('entered'))return ['Reveal the hiding place',has('window')?'Signal Watson at the open window.':'Speak to Irene or approach the window to ask for air.'];
 if(has('plan'))return ['Carry out the deception','At Briony Lodge, perform the staged rescue to gain entry.'];
 if(has('marriage'))return ['Devise a plan with Watson',clues.includes('windows')?'Return to Baker Street and make a deduction.':'Inspect the lodge’s windows, then reason with Watson.'];
 if(has('destination'))return ['Follow Irene and Norton','Travel to the Church of St. Monica and speak to Norton.'];
 if(has('routine'))return ['Follow the hurried carriages','The groom has identified a frequent visitor. Where is he going?'];
 if(has('briefed'))return ['Investigate Irene Adler',has('disguised')?'Interview the groom on Serpentine Avenue.':'Put on a groom’s disguise at the Baker Street wardrobe.'];
 if(has('identity'))return ['Hear the King’s account','Ask about the photograph and Irene, then accept the case.'];
 if(clues.includes('letter')&&clues.includes('watermark'))return ['Identify the masked visitor','Use “Make a deduction” to connect your observations.'];
 if(clues.includes('letter'))return ['Trace the paper’s origin','Search the Continental Gazetteer in the bookcase.'];
 return ['Examine the visitor’s letter','Walk to the writing desk and inspect the pink notepaper.'];
}
function hint(){const [title,detail]=objectives();say('A word from Watson',detail+'\n\nClick a labelled point in the scene to walk there and interact. Use Locations in the casebook to travel.',[['Back to the investigation',closeDialog]],'watson','HINT · '+title.toUpperCase());}
function renderUI(){
 $('location').textContent=scenes[scene].name;$('atmosphere').textContent=scenes[scene].sub;
 $('act').textContent=['ACT I · A MASKED VISITOR','ACT II · THE WOMAN AT BRIONY LODGE','ACT III · AN UNEXPECTED MARRIAGE','ACT IV · A FALSE ALARM','ACT V · THE WOMAN','CASE CLOSED · A SCANDAL IN BOHEMIA'][act];
 $('time').textContent=has('morning')?'THE FOLLOWING MORNING · 8:00':has('plan')?'LONDON · DUSK':has('briefed')?'LONDON · THE NEXT DAY':'LONDON · 1888';
 $('count').textContent=String(clues.length).padStart(2,'0');const [title,detail]=objectives();$('objective').textContent=title;$('objective-detail').textContent=detail;
 $('progress-label').textContent=act+' / 5';$('progress').style.width=(act*20)+'%';
 $('costume').textContent=has('entered')&&!has('morning')?'SHERLOCK HOLMES · Clergyman disguise':has('disguised')&&!has('plan')?'SHERLOCK HOLMES · Groom disguise':'SHERLOCK HOLMES · Consulting detective';
 $('evidence-tab').classList.toggle('selected',tab==='evidence');$('travel-tab').classList.toggle('selected',tab==='travel');
 $('entries').replaceChildren();
 if(tab==='evidence'){
 if(!clues.length){const p=document.createElement('p');p.className='empty';p.textContent='Nothing is trivial. Inspect your surroundings to begin collecting evidence.';$('entries').append(p);}
 [...clues].reverse().forEach((id,i)=>{const b=document.createElement('button');b.className='entry';const s=document.createElement('span');s.textContent='OBSERVATION '+String(clues.length-i).padStart(2,'0');b.append(s,document.createTextNode(clueData[id][0]));b.onclick=()=>say(clueData[id][0],clueData[id][1],[],null,'CASEBOOK');$('entries').append(b);});
 }else Object.keys(scenes).forEach(id=>{const b=document.createElement('button');b.className='entry'+(!unlocked(id)?' locked':'');b.disabled=!unlocked(id);const s=document.createElement('span');s.textContent=scene===id?'YOU ARE HERE':unlocked(id)?'TRAVEL':'LEAD NOT YET DISCOVERED';b.append(s,document.createTextNode(scenes[id].name));b.onclick=()=>go(id);$('entries').append(b);});
 $('touch-targets').replaceChildren();spots().forEach(s=>{const b=document.createElement('button');b.textContent=s.label;b.onclick=()=>walkTo(s);$('touch-targets').append(b);});
 $('hotspots').replaceChildren();spots().forEach(s=>{let b=document.createElement('button');b.className='hotspot';b.textContent=(s.npc?'◇ ':'⌕ ')+s.label;b.style.left=(s.x/W*100)+'%';b.style.top=s.sy+'%';b.onclick=()=>walkTo(s);$('hotspots').append(b);});
 $('deduce').textContent=has('solved')?'✓ Review the conclusion':'◇ Make a deduction';
}
function walkTo(s){if(paused())return;pending=s.id;target={x:s.x,y:s.y};canvas.focus({preventScroll:true});}
function nearest(){return spots().map(s=>({...s,d:Math.hypot(s.x-player.x,(s.y-player.y)*1.2)})).sort((a,b)=>a.d-b.d)[0];}
function interact(){if(paused())return;const s=nearest();if(s&&s.d<165)s.action();else toast('Move closer to a person or object—or click its label.');}
function step(dt){
 if(paused()){moving=false;return;}
 let dx=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0),dy=(keys.KeyS||keys.ArrowDown?1:0)-(keys.KeyW||keys.ArrowUp?1:0);
 if(dx||dy){target=null;pending=null;const length=Math.hypot(dx,dy);dx/=length;dy/=length;}
 else if(target){const a=target.x-player.x,b=target.y-player.y,d=Math.hypot(a,b);if(d<7){const id=pending;target=null;pending=null;const s=spots().find(s=>s.id===id);if(s)s.action();return;}dx=a/d;dy=b/d;}
 moving=!!(dx||dy);if(dx)facing=dx<0?-1:1;player.x=Math.max(75,Math.min(W-70,player.x+dx*290*dt));player.y=Math.max(595,Math.min(752,player.y+dy*200*dt));
}
function actor(name,x,y,flip=1,isPlayer=false,t=0){const im=images[name];if(!im.complete||!im.naturalWidth)return;const scale=.80+(y-580)/470;const h=255*scale,w=h*im.naturalWidth/im.naturalHeight;const bob=isPlayer&&moving?Math.sin(t*.017)*3:0;ctx.save();ctx.fillStyle='#030a0b65';ctx.beginPath();ctx.ellipse(x,y+2,w*.42,12*scale,0,0,Math.PI*2);ctx.fill();if(isPlayer){ctx.strokeStyle='#d8bd7b99';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y+3,w*.44,14*scale,0,0,Math.PI*2);ctx.stroke();}ctx.translate(x,y+bob);ctx.scale(flip,1);ctx.drawImage(im,-w/2,-h,w,h);ctx.restore();}
function draw(t){
 ctx.clearRect(0,0,W,H);const bg=images[scene];if(bg.complete&&bg.naturalWidth)ctx.drawImage(bg,0,0,W,H);else{ctx.fillStyle='#142325';ctx.fillRect(0,0,W,H);ctx.fillStyle='#d1b17a';ctx.font='24px Georgia';ctx.textAlign='center';ctx.fillText(assetErrors.length?'An illustration could not load. Please refresh.':'Lighting the gas lamps…',W/2,H/2);}
 const shade=ctx.createLinearGradient(0,0,0,240);shade.addColorStop(0,'#071217c9');shade.addColorStop(1,'#07121700');ctx.fillStyle=shade;ctx.fillRect(0,0,W,240);
 const chars=spots().filter(s=>s.npc).map(s=>({name:s.npc,x:s.x,y:s.y}));chars.push({name:outfit(),...player,isPlayer:true});chars.sort((a,b)=>a.y-b.y).forEach(c=>actor(c.name,c.x,c.y,c.isPlayer?facing:-1,c.isPlayer,t));
 if(target){ctx.strokeStyle='#e2c88b99';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(target.x,target.y,14,5,0,0,Math.PI*2);ctx.stroke();}
 // Atmospheric dust, constrained to the scene, never obscures labels.
 for(let i=0;i<18;i++){let x=(i*137+Math.sin(t/5000+i)*30)%W,y=(i*47-t/90)%H;if(y<0)y+=H;ctx.fillStyle='#f4d49535';ctx.fillRect(x,y,2,2);}
 if(smoke){ctx.fillStyle='rgba(205,214,213,.28)';for(let i=0;i<8;i++){ctx.beginPath();ctx.ellipse(100+i*170,480+Math.sin(t/800+i)*60,170,90,0,0,7);ctx.fill();}}
}
let lastPaint=0;
function frame(t){
 if(document.hidden){last=t;requestAnimationFrame(frame);return;}
 const dt=Math.min((t-last)/1000,.04);last=t;step(dt);
 // Keep original scene resolution; limit mobile rendering to 30 fps to save battery.
 if(!phoneLayout.matches||t-lastPaint>=1000/30){draw(t);lastPaint=t;}
 requestAnimationFrame(frame);
}
const moveCodes=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'];
window.addEventListener('keydown',e=>{if(paused())return;if(moveCodes.includes(e.code)){e.preventDefault();keys[e.code]=true;}if(e.code==='KeyE'&&!e.repeat){e.preventDefault();interact();}});
window.addEventListener('keyup',e=>{keys[e.code]=false;});window.addEventListener('blur',()=>{keys={};target=null;pending=null;});
canvas.addEventListener('pointerdown',e=>{if(paused())return;const r=canvas.getBoundingClientRect();target={x:Math.max(75,Math.min(W-70,(e.clientX-r.left)/r.width*W)),y:Math.max(595,Math.min(752,(e.clientY-r.top)/r.height*H))};pending=null;canvas.focus({preventScroll:true});});
modal.addEventListener('close',()=>{keys={};});
$('close-dialog').onclick=closeDialog;$('interact').onclick=interact;$('deduce').onclick=()=>has('solved')?ending():deduce();$('hint').onclick=hint;
$('evidence-tab').onclick=()=>{tab='evidence';renderUI();};$('travel-tab').onclick=()=>{tab='travel';renderUI();};
$('labels').onclick=()=>{showLabels=!showLabels;$('hotspots').classList.toggle('hidden',!showLabels);$('labels').setAttribute('aria-pressed',showLabels);};
$('help').onclick=()=>say('How to investigate','On a phone, hold the arrow pad or tap the floor to walk. Tap a button beneath the scene to approach a person or object. Use Casebook & travel for clues and locations. Rotate your phone for a wider view. On a computer, use WASD or the arrow keys.\nClick a labelled person or object to approach and interact automatically. Press E near a target to interact. Conversations pause movement.\nGather observations in Evidence. Use Locations to travel and Make a deduction to connect the clues. Watson always has a hint.\nThis short prototype plays through the complete story. Progress lasts until you refresh or close the page.',[['Begin investigating',closeDialog]],null,'FIELD GUIDE');
$('about').onclick=()=>say('A Scandal in Bohemia','A playable adaptation of Arthur Conan Doyle’s 1891 story, beginning on PDF page 9 in the supplied collection.\nDialogue is adapted and scenes are compressed for play. The narrative outcome is preserved. Illustrations were generated for this prototype.\nYour progress stays in this page for this session.',[['Read the original PDF',()=>window.open('https://sherlock-holm.es/stories/pdf/letter/1-sided/advs.pdf#page=9','_blank','noopener')],['Restart the case',restartPrompt],['Return to the investigation',closeDialog]],null,'ABOUT THIS ADAPTATION');
function restartPrompt(){say('Begin again?','This will clear the evidence and progress in this session.',[['Keep investigating',closeDialog],['Restart the case',()=>{scene='baker';act=0;flags={};clues=[];tab='evidence';player={x:690,y:680};target=null;pending=null;smoke=0;note('London, 1888. An unsigned letter lies on our table. Its author requests complete discretion—and intends to arrive wearing a mask. Before we hear his story, let us see what the paper can tell us.');renderUI();}]],null,'NEW INVESTIGATION');}
function gameState(){return {scene,act,objective:objectives()[0],clues:[...clues],availableLocations:Object.keys(scenes).filter(unlocked),targets:spots().map(s=>({id:s.id,label:s.label})),player:{...player},complete:has('solved')};}
if(document.modelContext?.registerTool){try{Promise.resolve(document.modelContext.registerTool({name:'read_investigation',description:'Read the current Sherlock Holmes case progress, collected clues, available locations and scene targets.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>gameState()})).catch(()=>{});}catch{}}
$('open-casebook').onclick=()=>{keys={};target=null;pending=null;$('book-slot').append(casebook);bookModal.showModal();};
$('close-book').onclick=closeBook;
bookModal.addEventListener('close',()=>{bookHome.append(casebook);keys={};});
phoneLayout.addEventListener('change',()=>{closeBook();keys={};});
const padButtons=[...document.querySelectorAll('#dpad button')];
for(const button of padButtons){
 let activePointer=null;
 const release=e=>{if(activePointer===null||(e&&e.pointerId!==activePointer))return;activePointer=null;keys[button.dataset.key]=false;button.classList.remove('held');};
 button.addEventListener('pointerdown',e=>{if(paused()||activePointer!==null)return;e.preventDefault();activePointer=e.pointerId;button.setPointerCapture(e.pointerId);keys[button.dataset.key]=true;target=null;pending=null;button.classList.add('held');});
 button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);
 window.addEventListener('blur',()=>release());
 document.addEventListener('visibilitychange',()=>{if(document.hidden)release();});
}
document.addEventListener('visibilitychange',()=>{keys={};target=null;pending=null;last=0;});
renderUI();requestAnimationFrame(frame);
