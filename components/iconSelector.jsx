'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Image, X } from 'lucide-react'

export default function IconSelector({ onSelect, mapName, show, children }) {
  const [search, setSearch] = useState('')
  const [commonIcons, setCommonIcons] = useState([])
  const [mainIcons, setMainIcons] = useState([])
  const [mapIcons, setMapIcons] = useState([])
  const [filteredMain, setFilteredMain] = useState([])
  const [urlInput, setUrlInput] = useState('')

  useEffect(() => {
    fetch('/svg/common.json').then(res => res.json()).then(setCommonIcons)
    fetch('/svg/main.json').then(res => res.json()).then(data => {
      setMainIcons(data)
      setFilteredMain(data)
    })

    if (mapName) {
      fetch(`/svg/${mapName}.json`)
        .then(res => res.json())
        .then(setMapIcons)
    }
  }, [mapName])

  useEffect(() => {
    if (!search) return setFilteredMain(mainIcons.slice(0, 22))
    const filtered = mainIcons.filter(name =>
      name.toLowerCase().includes(search.toLowerCase())
    )
    setFilteredMain(filtered.slice(0, 22))
  }, [search, mainIcons])


  const renderIcon = (name, folder) => (
    <img
      src={`/svg/${folder}/${name}.svg`}
      alt={name}
      className="w-8 h-8 cursor-pointer"
      loading="lazy"
      key={name}
      title={name}
      onClick={() => onSelect({ name, folder })}
    />
  )

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-lg h-[650px] icon-dialog">
        <DialogHeader>
          <DialogTitle>Select an Icon</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3 overflow-y-auto h-[650px]">
          {/* Common Icons */}
          <div>
            <div className="text-sm font-medium mb-1">Common Icons</div>
            <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto">
              {commonIcons.map(icon => {
                return renderIcon(icon, 'main')
              })}
            </div>
          </div>

          {/* Search + Tabs */}
          <Tabs defaultValue="main" className="w-full">
            <TabsList className="mb-2">
              <TabsTrigger value="main">Main</TabsTrigger>
              {mapIcons.length > 0 && <TabsTrigger value="map">{mapName}</TabsTrigger>}
              <TabsTrigger value="url">URL</TabsTrigger>
            </TabsList>


            <TabsContent value="main">
              <Input
                value={search}
                className="font-mono mb-3"
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search all icons..."
              />
              <div className="flex flex-wrap gap-2 max-h-[220px] overflow-auto">
                {filteredMain.map(icon => {
                  return renderIcon(icon, 'main')
                })}
              </div>
              <p className='text-sm mt-4 ml-2 text-muted-foreground'>Not all icons shown, use search to find an icon</p>
            </TabsContent>

            {mapIcons.length > 0 && (
              <TabsContent value="map">
                <div className="flex flex-wrap gap-2 max-h-[250px] overflow-auto">
                  {mapIcons.map(icon => {
                    return renderIcon(icon, mapName)
                  })}
                </div>
              </TabsContent>
            )}
            <TabsContent value="url">
              <div className="space-y-2">
                <Input
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="URL to image or SVG (e.g. https://...)"
                  className="font-mono"
                />
                <div className="text-sm ml-4 text-muted-foreground">Tip: Color is determined at the source.</div>

                {urlInput && (
                  <div className="mt-3 flex flex-col items-center gap-3">
                    <img
                      src={urlInput}
                      alt="Custom icon preview"
                      className="w-10 h-10 object-contain"
                      loading="lazy"
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      className="cursor-pointer w-full"
                      onClick={() => onSelect(urlInput)}
                    >
                      Use Icon
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

          </Tabs>

          {/* Accordion Help */}
          <Accordion type="single" collapsible className="text-sm overflow-hidden">
            <AccordionItem value="instructions">
              <AccordionTrigger className="text-left cursor-pointer">
                Need help finding your icon?
              </AccordionTrigger>
              <AccordionContent>
                <ul className="pl-4 list-disc mb-2">
                  {mapName.includes("lancer") && (
                    <li>
                      Some Lancer icons are from {' '}
                      <a
                        href="https://game-icons.net"
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-300"
                      >
                        game-icons.net
                      </a>
                    </li>
                  )}
                  <li>
                    Some icons are from{' '}
                    <a
                      href="https://www.freepik.com/search?format=search&type=icon"
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-300 cursor-pointer"
                    >
                      Freepik
                    </a>
                    , this can be a good resource for adding new icons.
                  </li>
                  <li>
                    Sometimes icon's are named different than you'd guess. More robust search alogrithms are on the source websites. Try searching on {' '}
                    <a
                      href="https://fontawesome.com/search"
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-300 cursor-pointer"
                    >
                      Font Awesome
                    </a>{' '}
                    or{' '}
                    <a
                      href="https://lucide.dev/icons/"
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-300 cursor-pointer"
                    >
                      Lucide
                    </a>
                    , to find its name and paste it into the search here.
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </DialogContent>
    </Dialog>
  )
}
