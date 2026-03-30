'use client'

import Link from "next/link"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import apocalypseStyle from "@/lib/maplibreStyles/apocalypse.json"
import darkmatterStyle from "@/lib/maplibreStyles/darkmatter.json"
import datavizDarkStyle from "@/lib/maplibreStyles/dataviz_dark.json"
import datavizLightStyle from "@/lib/maplibreStyles/dataviz_light.json"
import halloweenStyle from "@/lib/maplibreStyles/halloween.json"
import libertyStyle from "@/lib/maplibreStyles/liberty.json"
import positronStyle from "@/lib/maplibreStyles/positron.json"
import satelliteStyle from "@/lib/maplibreStyles/satellite.json"
import tonerStyle from "@/lib/maplibreStyles/toner.json"
import vintageStyle from "@/lib/maplibreStyles/vintage.json"
import { ArrowLeft, LoaderCircle, WandSparkles, Earth, Sparkle, Pencil } from "lucide-react"
import StarsBackgroundSimple from "@/components/ui/starbackgroundSimple"
import { toast } from "sonner"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group"
import { cn, getConsts, getMaps, localSet } from "@/lib/utils"
import Image from "next/image"

const styleMap = {
  "apocalypse": apocalypseStyle,
  "darkmatter": darkmatterStyle,
  "dataviz_dark": datavizDarkStyle,
  "dataviz_light": datavizLightStyle,
  "halloween": halloweenStyle,
  "liberty": libertyStyle,
  "positron": positronStyle,
  "satellite": satelliteStyle,
  "toner": tonerStyle,
  "vintage": vintageStyle,
}

export default function Scratch({ styleIndex }) {
  const [submitting, setSubmitting] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const router = useRouter()

  const form = useForm({
    defaultValues: {
      mapType: "",
      spaceScale: "",
      earthUnits: "",
      ftl: "",
      stylePreset: "",
      colors: "",
      name: "",
    },
    mode: "onChange",
  })

  const mapType = form.watch("mapType")
  const visibleSteps = useMemo(() => {
    const steps = ["mapType"]
    if (mapType === "space") {
      steps.push("spaceScale")
      steps.push("ftl")
    }

    if (mapType === "earth") {
      steps.push("earthUnits")
      steps.push("stylePreset")
    }
    steps.push("colors")
    steps.push("name")
    return steps
  }, [mapType])

  const currentStep = visibleSteps[Math.min(stepIndex, visibleSteps.length - 1)]

  function canContinue() {
    const values = form.getValues()

    switch (currentStep) {
      case "mapType":
        return !!values.mapType
      case "spaceScale":
        return !!values.spaceScale
      case "earthUnits":
        return !!values.earthUnits
      case "ftl":
        return !!values.ftl
      case "stylePreset":
        return !!values.stylePreset
      case "colors":
        return !!values.colors
      case "name":
        return !!values.name?.trim()
      default:
        return false
    }
  }

  function nextStep() {
    if (!canContinue()) {
      if (currentStep === "name") {
        form.setError("name", {
          type: "manual",
          message: "Please enter a map name",
        })
      }
      return
    }

    if (stepIndex < visibleSteps.length - 1) {
      setStepIndex((s) => s + 1)
    }
  }

  function prevStep() {
    if (stepIndex > 0) {
      setStepIndex((s) => s - 1)
    }
  }

  async function submit(body) {
    if (!body.name?.trim()) {
      form.setError("name", {
        type: "manual",
        message: "Please enter a map name",
      })
      return
    }

    setSubmitting(true)

    try {
      let defaults
      if (body.mapType === "earth") {
        // use Fallout's presets
        defaults = getConsts("fallout")
        if (body.earthUnits === "metric") {
          defaults.UNIT = "km"
          defaults.TRAVEL_RATE_UNIT = "kmph"
          defaults.TRAVEL_RATE = 5
          defaults.DISTANCE_CONVERTER = 1
        } else if (body.earthUnits === "imperial") {
          defaults.UNIT = "miles"
          defaults.TRAVEL_RATE_UNIT = "mph"
          defaults.TRAVEL_RATE = 3
          defaults.DISTANCE_CONVERTER = 0.621371
        }

        defaults.STYLE = styleMap[body.stylePreset]


      } else if (body.mapType === "space") {
        defaults = getConsts("custom")
        if (body.ftl === "yes") {
          defaults.TIME_DILATION = false
          // defaults.UNIT = "ly"
        } else if (body.ftl === "no") {
          defaults.TIME_DILATION = true
          // defaults.UNIT = "ly"
          defaults.TRAVEL_RATE_UNIT = getConsts("lancer").TRAVEL_RATE_UNIT
          defaults.TRAVEL_RATE = getConsts("lancer").TRAVEL_RATE
        }
        if (body.spaceScale === "galaxy") {
          defaults.GENERATE_LOCATIONS = true
        } else if (body.spaceScale === "solar-system") {
          defaults.GENERATE_LOCATIONS = false
        }
      }


      const colors = allColors.find(c => c.value === body.colors)
      const bgEnd = defaults.BG.split(" ").slice(1)

      defaults.BG = colors.bgColor + " " + bgEnd.join(" ")
      defaults.STYLES.MAIN_COLOR = colors.mainColor
      defaults.STYLES.HIGHLIGHT_COLOR = colors.highlightColor

      const now = Date.now()
      getMaps().then(maps => {
        localSet("maps", {
          ...maps, [`custom-${now}`]: {
            geojson: { type: "FeatureCollection", features: [] },
            name: body.name,
            updated: now,
            id: now,
            meta: {},
            map: "custom",
            config: defaults,
          }
        })
      })

      toast.success("Map created")
      router.push(`/custom?id=${now}`)

    } catch (err) {
      console.error(err)
      toast.warning("Could not create map at this time")
    } finally {
      setSubmitting(false)
    }
  }

  const isLastStep = stepIndex === visibleSteps.length - 1

  return (
    <div className="starfield mt-10">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(submit)}
          className="container mx-auto mt-4"
        >
          <Card className="max-w-2xl md:mx-auto m-4">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle>
                    <WandSparkles className="inline mr-2" size={20} />
                    Custom
                  </CardTitle>
                </div>

                <Link href="/">
                  <Button variant="ghost" type="button">
                    <ArrowLeft />
                  </Button>
                </Link>
              </div>

              <div className="pt-3 overflow-x-auto">
                <Breadcrumb>
                  <BreadcrumbList className="flex-nowrap">
                    {visibleSteps.map((step, i) => (
                      <div key={step} className="flex items-center">
                        <BreadcrumbItem className="cursor-auto">
                          {i === stepIndex ? (
                            <BreadcrumbPage>{labelForStep(step)}</BreadcrumbPage>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              {labelForStep(step)}
                            </span>
                          )}
                        </BreadcrumbItem>

                        {i < visibleSteps.length - 1 && <BreadcrumbSeparator />}
                      </div>
                    ))}
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </CardHeader>

            <CardContent className="min-h-[320px]">
              {currentStep === "mapType" && (
                <FormField
                  control={form.control}
                  name="mapType"
                  render={({ field }) => (
                    <FormItem className="py-6">
                      <FormLabel className="w-full md:text-xl text-center text-gray-400 ml-8 ">
                        Where is the setting of your map?
                      </FormLabel>

                      <FormControl>
                        <div className="flex flex-col md:flex-row gap-6 justify-center items-center pt-6">

                          {/* SPACE */}
                          <Card
                            className={cn(
                              "w-[250px] h-[250px] lg:w-[269px] lg:h-[269px] cursor-pointer rounded-xl transition-all",
                              field.value === "space"
                                ? "ring-2 ring-primary scale-[1.03]"
                                : "hover:scale-[1.02]"
                            )}
                            onClick={() => field.onChange("space")}
                          >
                            <CardContent className="p-2 w-full h-full">
                              <StarsBackgroundSimple>
                                <CardDescription className="text-center w-[225px] h-[225px] lg:w-[243px] lg:h-[243px] hover-grow">
                                  <div className="flex flex-col items-center justify-center w-full h-full">

                                    <div className="bg-black rounded-full w-[120px] flex items-center justify-center">
                                      <Sparkle className="text-white w-12 h-12 lg:w-14 lg:h-14" strokeWidth={1.5} />
                                    </div>

                                    <span className="text-center text-3xl lg:text-4xl text-white">
                                      SPACE
                                    </span>

                                  </div>
                                </CardDescription>
                              </StarsBackgroundSimple>
                            </CardContent>
                          </Card >

                          {/* EARTH */}
                          <Card
                            className={cn(
                              "w-[250px] h-[250px] lg:w-[269px] lg:h-[269px] cursor-pointer rounded-xl transition-all",
                              field.value === "earth"
                                ? "ring-2 ring-primary scale-[1.03]"
                                : "hover:scale-[1.02]"
                            )}
                            onClick={() => field.onChange("earth")}
                          >
                            <CardContent className="p-2 w-full h-full">
                              <StarsBackgroundSimple>
                                <CardDescription className="text-center w-[225px] h-[225px] lg:w-[243px] lg:h-[243px] hover-grow">
                                  <div className="flex flex-col items-center justify-center w-full h-full">

                                    <div className="bg-black rounded-full w-[120px] flex items-center justify-center">
                                      <Earth className="text-white w-12 h-12 lg:w-14 lg:h-14" strokeWidth={1.5} />
                                    </div>

                                    <span className="text-center text-3xl lg:text-4xl text-white">
                                      EARTH
                                    </span>

                                  </div>
                                </CardDescription>
                              </StarsBackgroundSimple>
                            </CardContent>
                          </Card>

                        </div>
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {currentStep === "spaceScale" && (
                <FormField
                  control={form.control}
                  name="spaceScale"
                  render={({ field }) => (
                    <FormItem className="py-4">
                      <FormLabel>Generate Fake Child Locations?</FormLabel>
                      <FormDescription>
                        This determines if extra (fake) locations are generated for each point you create.
                      </FormDescription>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="grid gap-3 pt-4"
                        >
                          <label className="border rounded-xl p-4 cursor-pointer hover:bg-muted/50">
                            <div className="flex items-center gap-3">
                              <RadioGroupItem value="solar-system" id="spaceScale-solar" />
                              <div>
                                <div className="font-medium">No Generation</div>
                                <div className="text-sm text-muted-foreground">
                                  Best for Solar System scale maps, or for max control. Each point is it's own celestial body.
                                </div>
                              </div>
                            </div>
                          </label>

                          <label className="border rounded-xl p-4 cursor-pointer hover:bg-muted/50">
                            <div className="flex items-center gap-3">
                              <RadioGroupItem value="galaxy" id="spaceScale-galaxy" />
                              <div>
                                <div className="font-medium">Generation</div>
                                <div className="text-sm text-muted-foreground">
                                  Best for Galaxy scale maps. Stargazer will fill in the blanks (e.g. add a sun if there's none).
                                </div>
                              </div>
                            </div>
                          </label>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {currentStep === "earthUnits" && (
                <FormField
                  control={form.control}
                  name="earthUnits"
                  render={({ field }) => (
                    <FormItem className="py-4">
                      {/* <FormLabel>Measurement system</FormLabel>*/}
                      <FormDescription>
                        What measurement system should be used?
                      </FormDescription>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="grid gap-3 pt-4"
                        >
                          <label className="border rounded-xl p-4 cursor-pointer hover:bg-muted/50">
                            <div className="flex items-center gap-3">
                              <RadioGroupItem value="imperial" id="earthUnits-imperial" />
                              <div>
                                <div className="font-medium">Imperial</div>
                                <div className="text-sm text-muted-foreground">
                                  Miles, feet
                                </div>
                              </div>
                            </div>
                          </label>

                          <label className="border rounded-xl p-4 cursor-pointer hover:bg-muted/50">
                            <div className="flex items-center gap-3">
                              <RadioGroupItem value="metric" id="earthUnits-metric" />
                              <div>
                                <div className="font-medium">Metric</div>
                                <div className="text-sm text-muted-foreground">
                                  Kilometers, meters
                                </div>
                              </div>
                            </div>
                          </label>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {currentStep === "ftl" && (
                <FormField
                  control={form.control}
                  name="ftl"
                  render={({ field }) => (
                    <FormItem className="py-4">
                      <FormLabel>Is there FTL (Faster Than Light) travel?</FormLabel>
                      <FormDescription>
                        This impacts the speed and time calculations when measuring.
                      </FormDescription>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="grid gap-3 pt-4"
                        >
                          <label className="border rounded-xl p-4 cursor-pointer hover:bg-muted/50">
                            <div className="flex items-center gap-3">
                              <RadioGroupItem value="yes" id="ftl-yes" />
                              <div>
                                <div className="font-medium">Yes</div>
                                <div className="text-sm text-muted-foreground">
                                  Defaults to 300 ly/h
                                </div>
                              </div>
                            </div>
                          </label>

                          <label className="border rounded-xl p-4 cursor-pointer hover:bg-muted/50">
                            <div className="flex items-center gap-3">
                              <RadioGroupItem value="no" id="ftl-no" />
                              <div>
                                <div className="font-medium">No</div>
                                <div className="text-sm text-muted-foreground">
                                  Defaults to .995c
                                </div>
                              </div>
                            </div>
                          </label>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {currentStep === "stylePreset" && mapType === "earth" && (
                <FormField
                  control={form.control}
                  name="stylePreset"
                  render={({ field }) => (
                    <FormItem className="py-4">
                      <FormLabel>Which Style?</FormLabel>
                      <FormDescription>
                        You can swap these presets later if needed.
                      </FormDescription>

                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="grid gap-4 pt-4 md:grid-cols-2"
                        >
                          {getStyleOptions(styleIndex).map(style => (
                            <label
                              key={style.value}
                              className="border rounded-xl overflow-hidden cursor-pointer hover:bg-muted/40"
                            >
                              <div className="aspect-video bg-muted">
                                <img
                                  src={style.image}
                                  alt={style.label}
                                  className="h-full w-full object-cover"
                                />
                              </div>

                              <div className="p-4">
                                <div className="flex items-start gap-3">
                                  <RadioGroupItem
                                    value={style.value}
                                    id={`style-${style.value}`}
                                    className="mt-1"
                                  />
                                  <div>
                                    <div className="font-medium">{style.label}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {style.description}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </label>
                          ))}
                        </RadioGroup>
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {currentStep === "colors" && (
                <FormField
                  control={form.control}
                  name="colors"
                  render={({ field }) => (
                    <FormItem className="py-4">
                      <FormLabel>Which Colors?</FormLabel>
                      <FormDescription>
                        You can swap these colors later
                      </FormDescription>

                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="grid gap-4 pt-4 md:grid-cols-2"
                        >
                          {allColors.map(style => (
                            <label
                              key={style.value}
                              className="border rounded-xl overflow-hidden cursor-pointer hover:bg-muted/40"
                            >
                              <div className="aspect-video bg-muted">
                                <div className="w-full h-[33%]" style={{ backgroundColor: style.bgColor }} />
                                <div className="w-full h-[33%]" style={{ backgroundColor: style.mainColor }} />
                                <div className="w-full h-[33%]" style={{ backgroundColor: style.highlightColor }} />
                              </div>

                              <div className="p-4">
                                <div className="flex items-start gap-3">
                                  <RadioGroupItem
                                    value={style.value}
                                    id={`color-${style.value}`}
                                    className="mt-1"
                                  />
                                  <div>
                                    <div className="font-medium">{style.label}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {style.description}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </label>
                          ))}
                        </RadioGroup>
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {currentStep === "name" && (
                <FormField
                  control={form.control}
                  name="name"
                  rules={{
                    maxLength: {
                      value: 32,
                      message: "Name cannot exceed 32 characters",
                    },
                    pattern: {
                      value: /^[a-zA-Z0-9 _-]*$/,
                      message:
                        "Name can only contain letters, numbers, spaces, underscores, and dashes",
                    },
                  }}
                  render={({ field }) => (
                    <FormItem className="py-4">
                      <FormLabel >
                        <Pencil size={18} className="inline mr-2" />
                        Name your map
                      </FormLabel>
                      <FormControl>
                        <Input className="my-3"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>

            <CardFooter className="flex flex-col gap-4 w-full">
              <div className="flex w-full gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={stepIndex === 0 || submitting}
                  className="flex-1"
                >
                  Back
                </Button>

                {!isLastStep ? (
                  <Button
                    key="continue"
                    type="button"
                    onClick={nextStep}
                    disabled={submitting}
                    className="flex-1"
                  >
                    Continue
                  </Button>
                ) : (
                  <Button
                    key="submit"
                    type="submit"
                    disabled={submitting}
                    className="flex-1"
                  >
                    {submitting ? <LoaderCircle className="animate-spin" /> : "Create Map"}
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  )
}

function labelForStep(step) {
  switch (step) {
    case "mapType":
      return "Setting"
    case "spaceScale":
      return "Generation"
    case "earthUnits":
      return "Units"
    case "ftl":
      return "FTL"
    case "stylePreset":
      return "Style"
    case "name":
      return "Name"
    case "colors":
      return "Colors"
    default:
      return step
  }
}

const allColors = [
    {
      value: "blue",
      label: "blue",
      description: "",
      mainColor: "#0d126e",
      bgColor: "#010f45",
      highlightColor: "#384E96",
    },
    {
      value: "red",
      label: "red",
      description: "",
      mainColor: "#6E0D0D",
      bgColor: "#290404",
      highlightColor: "#AD7272",
    },
    {
      value: "purple",
      label: "purple",
      description: "",
      mainColor: "#3E0D6E",
      bgColor: "#1A0429",
      highlightColor: "#D097E8",
    },
    {
      value: "green",
      label: "green",
      description: "",
      mainColor: "#0F6E0D",
      bgColor: "#052904",
      highlightColor: "#3D964C",
    },
    {
      value: "orange",
      label: "orange",
      description: "",
      mainColor: "#6E4A0D",
      bgColor: "#302606",
      highlightColor: "#F7DAA6",
    },
    {
      value: "cyan",
      label: "cyan",
      description: "",
      mainColor: "#0D6E69",
      bgColor: "#053633",
      highlightColor: "#B8FFF9",
    },
  ]

function getStyleOptions(styleIndex) {
  return styleIndex.map(style => {
    let description = ""
    if (style === "liberty") {
      description = "has 3D terrain data"
    }
    return {
      value: style,
      label: style.replaceAll("_", " "),
      description,
      image: `/thumbnails/${style}.webp`,
    }
  })
}
