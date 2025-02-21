<h1>🚀 OrbitClient 2.0 Beta (Open Source)</h1>
<p>OrbitClient is an optimized, fully customizable client for DarkOrbit, now <strong>open-source</strong> and ready for community-driven development!</p>

<h1><a href="#downloads">Go to Downloads</a></h1>

<hr>

<h2>🚀 Features</h2>
<ul>
    <li>✨ <strong>Complete client rewrite in Object-Oriented Programming (OOP)</strong> for better performance and scalability.</li>
    <li>🛠️ <strong>Modular architecture</strong> allowing future plugin integration.</li>
    <li>⭐ <strong>Bookmark system</strong> with a redesigned favorites bar.</li>
    <li>🎨 <strong>Enhanced transitions and animations</strong> for smoother interactions.</li>
    <li>🌎 Language corrections + new <strong>Mexican Spanish</strong> localization.</li>
</ul>

<hr>

<h2>🛠️ Installation</h2>

<h3>Prerequisites</h3>
<p><strong>Node.js</strong> and <strong>npm</strong> must be installed.</p>

<h3>Steps to Install</h3>
<ol>
    <li><strong>Clone the repository:</strong>
        <pre><code>git clone https://github.com/retroblack26/OrbitClient.git</code></pre>
    </li>
    <li><strong>Navigate to the project directory:</strong>
        <pre><code>cd path/to/OrbitClient</code></pre>
    </li>
    <li><strong>Install dependencies:</strong>
        <pre><code>npm install</code></pre>
    </li>
</ol>

<hr>

<h2>▶️ Running the App</h2>
<p>To start the application, run:</p>
<pre><code>npm run start</code></pre>

<p>💡 <strong>Tip:</strong> Enable <strong>developer mode</strong> by setting the following in <code>Main.js</code>:</p>
<pre><code>process.env.ELECTRON_IS_DEV = 1;</code></pre>

<p>Or run it directly from the terminal:</p>
<pre><code>ELECTRON_IS_DEV=1 npm run start</code></pre>

<hr>

<h2>🔨 Building the Application</h2>
<p>Build the client for different platforms:</p>
<ul>
    <li><strong>Windows:</strong>
        <pre><code>npm run buildWin</code></pre>
    </li>
    <li><strong>MacOS:</strong>
        <pre><code>npm run buildMac</code></pre>
    </li>
    <li><strong>Linux (Debian):</strong>
        <pre><code>npm run buildLinux</code></pre>
    </li>
</ul>

<p><strong>Note:</strong> Use <code>--openssl_fips=''</code> if needed:</p>
<pre><code>npm run buildMac --openssl_fips=''</code></pre>

<p>Built files will appear in the <code>dist</code> directory.</p>

<hr>

<h2>🚧 Obfuscation & Publishing</h2>
<ol>
    <li><strong>Navigate to ToolScripts:</strong>
        <pre><code>cd ToolScripts</code></pre>
    </li>
    <li><strong>Minify and obfuscate the code:</strong>
        <pre><code>node minify.js</code></pre>
    </li>
    <li><strong>Build the app:</strong>
        <pre><code>cd dist
npm run buildWin</code></pre>
    </li>
</ol>

<p>The final app will be in <code>distM/dist</code>.</p>

<hr>

<h2>🌐 Localization</h2>
<p>OrbitClient supports multi-language localization using <strong>DeepL API</strong>.</p>
<p>📌 Add your DeepL API key in <code>translator.js</code>. Get it <a href="https://www.deepl.com/pro-api?cta=header-pro-api/" target="_blank">here</a>.</p>

<h3>Translation Management</h3>
<pre><code>node translator.js &lt;command&gt;</code></pre>

<h4>Commands:</h4>
<ul>
    <li>Add a new key:
        <pre><code>node translator.js add &lt;key&gt; "&lt;value&gt;"</code></pre>
    </li>
    <li>Remove a key:
        <pre><code>node translator.js remove &lt;key&gt;</code></pre>
    </li>
    <li>Fill missing:
        <pre><code>node translator.js fill-missing [&lt;key&gt;]</code></pre>
    </li>
    <li>Verify translations:
        <pre><code>node translator.js verify</code></pre>
    </li>
    <li>Add a language:
        <pre><code>node translator.js add-lang &lt;langCode&gt; &lt;deepLCode&gt; [sourceLang]</code></pre>
    </li>
</ul>

<hr>

<h2>🧑‍💻 Contribution & Support</h2>
<p>Contributions welcome! Fork the project and submit a pull request.  
Join <strong>#⌨coding</strong> on Discord for discussions.</p>
<p id="downloads">📥 <strong>Downloads:</strong> 
<ul>
    <li><a href="https://orbitclient.online/downloads/latest/OrbitClient.dmg" target="_blank">macOS</a></p>
    </li>
    <li><a href="https://orbitclient.online/downloads/latest/OrbitClient Setup.exe" target="_blank">Windows</a></p>
    </li>
</ul>

