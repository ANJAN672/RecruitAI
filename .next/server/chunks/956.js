"use strict";exports.id=956,exports.ids=[956],exports.modules={50956:(a,b,c)=>{async function d(a,b={}){let{apiKey:c,model:e}=function(){let a=process.env.OPENROUTER_API_KEY?.trim(),b=process.env.OPENROUTER_MODEL?.trim();if(!a)throw Error("OPENROUTER_API_KEY is not set");if(!b)throw Error("OPENROUTER_MODEL is not set");return{apiKey:a,model:b}}(),f=await fetch("https://openrouter.ai/api/v1/chat/completions",{method:"POST",headers:{Authorization:`Bearer ${c}`,"Content-Type":"application/json","HTTP-Referer":process.env.NEXT_PUBLIC_APP_URL||"http://localhost:3000"},body:JSON.stringify({model:e,messages:[{role:"user",content:a}],...b.json&&{response_format:{type:"json_object"}}})});if(!f.ok){let a=await f.json().catch(()=>({})),b=Error(a?.error?.message||f.statusText);throw b.status=f.status,b}let g=await f.json();return g.choices?.[0]?.message?.content?.trim()??""}async function e(a){let b=`Extract structured hiring requirements from this job description. Return valid JSON only with keys: role (string), experience (string), hard_skills (string array), soft_skills (string array), certifications (string array).

Job Description:
${a}`;return JSON.parse(await d(b,{json:!0})||"{}")}async function f(a,b,c){return d(`Generate a boolean search query for LinkedIn/Naukri based on these requirements:
Role: ${a}
Hard Skills: ${b}
Experience: ${c}

Return ONLY the boolean search string, nothing else.`)}async function g(a,b){let c=`Help a recruiter understand this job description.
Role: ${a}
Hard Skills: ${b}

Generate:
1. Brief explanations of the top 3 technical concepts.
2. 3 good interview questions to ask candidates, with expected answers.

Return valid JSON only: { "concepts": [{ "name": "...", "explanation": "..." }], "interview_questions": [{ "question": "...", "expected_answer": "..." }] }`;return JSON.parse(await d(c,{json:!0})||"{}")}async function h(a,b){let c=`Score this candidate against the job. Be concise.
Job: ${b.role}, ${b.experience}, Skills: ${b.hard_skills}
Candidate:
${a}

Return valid JSON only: { "skills": [...], "experience": "brief summary", "match_score": 0-100, "match_reasoning": "1-2 sentences" }`;return JSON.parse(await d(c,{json:!0})||"{}")}async function i(a){let b=`Convert these raw interview notes into a structured report.
Notes:
${a}

Return valid JSON only: { "strengths": "...", "weaknesses": "...", "recommendation": "Proceed to next round / Reject / Hold" }`;return JSON.parse(await d(b,{json:!0})||"{}")}c.r(b),c.d(b,{generateBooleanSearch:()=>f,generateInterviewReport:()=>i,generateKnowledge:()=>g,parseJobDescription:()=>e,scoreCandidate:()=>h})}};